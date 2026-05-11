from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from typing import Optional
from datetime import datetime, timedelta

import sqlite3
import os

app = FastAPI()

DB_PATH = "/var/lib/intercept/events.db"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # NOT FOR PROD
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def build_event_response(rows):
    events = {}

    for row in rows:
        eid = row["id"]

        if eid not in events:
            events[eid] = {
                "id": eid,
                "kernel_time": row["kernel_time"],
                "timestamp": row["timestamp"],
                "device_id": row["device_id"],
                "device_name": row["device_name"],
                "os_name": row["os_name"],
                "os_version": row["os_version"],
                "pid": row["pid"],
                "ppid": row["ppid"],
                "uid": row["uid"],
                "gid": row["gid"],
                "comm": row["comm"],
                "filename": row["filename"],
                "cmdline": row["cmdline"],
                "cwd": row["cwd"],
                "source": row["source"],
                "action": row["action"],
                "family": row["family"],
                "remote_ip4": row["remote_ip4"],
                "remote_port": row["remote_port"],
                "suspicious": row["suspicious"],
                "severity": row["severity"],
                "detections": [],
            }

        if row["detection_id"] is not None:
            events[eid]["detections"].append(
                {
                    "rule_id": row["rule_id"],
                    "rule_name": row["rule_name"],
                    "description": row["detection_description"],
                    "severity": row["detection_severity"],
                    "confidence": row["confidence"],
                    "mitre_tactic": row["mitre_tactic"],
                    "mitre_technique_id": row["mitre_technique_id"],
                    "mitre_technique_name": row["mitre_technique_name"],
                }
            )

    return list(events.values())


def parse_window(window: str):
    if window.endswith("m"):
        return timedelta(minutes=int(window[:-1]))

    if window.endswith("h"):
        return timedelta(hours=int(window[:-1]))

    if window.endswith("d"):
        return timedelta(days=int(window[:-1]))

    return timedelta(hours=1)


def get_bucket_seconds(interval: str):
    mapping = {
        "1m": 60,
        "5m": 300,
        "15m": 900,
        "1h": 3600,
    }

    return mapping.get(interval, 60)


@app.get("/events")
def get_events(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    source: Optional[int] = None,
    pid: Optional[int] = None,
    uid: Optional[int] = None,
):
    conn = get_db()
    cursor = conn.cursor()

    query = """
    SELECT 
        e.*,
        d.id as detection_id,
        d.rule_id,
        d.rule_name,
        d.description as detection_description,
        d.severity as detection_severity,
        d.mitre_tactic,
        d.mitre_technique_id,
        d.mitre_technique_name,
        d.confidence
    FROM events e
    LEFT JOIN detections d ON e.id = d.event_id
    WHERE 1=1
    """

    params = []

    if source is not None:
        query += " AND e.source = ?"
        params.append(source)

    if pid is not None:
        query += " AND e.pid = ?"
        params.append(pid)

    if uid is not None:
        query += " AND e.uid = ?"
        params.append(uid)

    query += """
    ORDER BY e.kernel_time DESC
    LIMIT ?
    OFFSET ?
    """

    params.extend([limit, offset])

    rows = cursor.execute(query, params).fetchall()

    conn.close()

    return build_event_response(rows)


@app.get("/suspicious")
def get_suspicious_events(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    source: Optional[int] = None,
    pid: Optional[int] = None,
    uid: Optional[int] = None,
):
    conn = get_db()
    cursor = conn.cursor()

    query = """
    SELECT 
        e.*,
        d.id as detection_id,
        d.rule_id,
        d.rule_name,
        d.description as detection_description,
        d.severity as detection_severity,
        d.mitre_tactic,
        d.mitre_technique_id,
        d.mitre_technique_name,
        d.confidence
    FROM events e
    LEFT JOIN detections d ON e.id = d.event_id
    WHERE e.suspicious = 1
    """

    params = []

    if source is not None:
        query += " AND e.source = ?"
        params.append(source)

    if pid is not None:
        query += " AND e.pid = ?"
        params.append(pid)

    if uid is not None:
        query += " AND e.uid = ?"
        params.append(uid)

    query += """
    ORDER BY e.kernel_time DESC
    LIMIT ?
    OFFSET ?
    """

    params.extend([limit, offset])

    rows = cursor.execute(query, params).fetchall()

    conn.close()

    return build_event_response(rows)


@app.get("/detections")
def get_detections(limit: int = 10000):
    conn = get_db()

    rows = conn.execute(
        """
        SELECT *
        FROM detections
        ORDER BY id DESC
        LIMIT ?
        """,
        (limit,),
    ).fetchall()

    conn.close()

    return [dict(r) for r in rows]


@app.get("/detections/timeseries")
def get_event_timeseries(
    window: str = Query("1h"),
    interval: str = Query("1m"),
):
    conn = get_db()
    cursor = conn.cursor()

    now = datetime.utcnow()
    start = now - parse_window(window)

    bucket_seconds = get_bucket_seconds(interval)

    RADAR_CATEGORIES = {
        "Exploiting": [
            "Initial Access",
            "Execution",
            "Privilege Escalation",
        ],
        "Persisting": [
            "Persistence",
            "Defense Evasion",
            "Command and Control",
        ],
        "Recon": [
            "Discovery",
            "Credential Access",
        ],
        "Moving": [
            "Lateral Movement",
        ],
        "Destruction": [
            "Collection",
            "Exfiltration",
            "Impact",
        ],
    }

    tactic_to_category = {}

    for category, tactics in RADAR_CATEGORIES.items():
        for tactic in tactics:
            tactic_to_category[tactic] = category

    query = f"""
    SELECT
        (CAST(strftime('%s', e.timestamp) AS INTEGER) / {bucket_seconds}) * {bucket_seconds} AS bucket,

        LOWER(d.severity) AS severity,
        d.mitre_tactic AS mitre_tactic

    FROM events e
    JOIN detections d
        ON e.id = d.event_id

    WHERE e.timestamp >= ?
    """

    rows = cursor.execute(query, (start.isoformat(),)).fetchall()

    conn.close()

    buckets = {}

    for row in rows:
        bucket = row["bucket"]

        if bucket not in buckets:
            buckets[bucket] = {
                "low": 0,
                "medium": 0,
                "high": 0,
                "Exploiting": 0,
                "Persisting": 0,
                "Recon": 0,
                "Moving": 0,
                "Destruction": 0,
            }

        severity = (row["severity"] or "low").lower()

        if severity in ["low", "medium", "high"]:
            buckets[bucket][severity] += 1
        else:
            buckets[bucket]["low"] += 1

        tactic = row["mitre_tactic"]

        category = tactic_to_category.get(tactic)

        if category:
            buckets[bucket][category] += 1

    results = []

    current = int(start.timestamp())
    end = int(now.timestamp())

    current = (current // bucket_seconds) * bucket_seconds

    empty_bucket = {
        "low": 0,
        "medium": 0,
        "high": 0,
        "Exploiting": 0,
        "Persisting": 0,
        "Recon": 0,
        "Moving": 0,
        "Destruction": 0,
    }

    while current <= end:
        bucket = buckets.get(current, empty_bucket.copy())

        results.append(
            {
                "time": datetime.utcfromtimestamp(current).isoformat() + "Z",
                **bucket,
            }
        )

        current += bucket_seconds

    return results


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
    )
