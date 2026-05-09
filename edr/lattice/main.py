from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
from typing import Optional
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

    query += " ORDER BY e.kernel_time DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    rows = cursor.execute(query, params).fetchall()
    conn.close()

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

        # attach detection if exists
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


@app.get("/detections")
def get_detections(limit: int = 10000):
    conn = get_db()
    rows = conn.execute(
        """
        SELECT * FROM detections
        ORDER BY id DESC
        LIMIT ?
    """,
        (limit,),
    ).fetchall()
    conn.close()

    return [dict(r) for r in rows]


@app.get("/suspicious")
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

    query += " ORDER BY e.kernel_time DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    rows = cursor.execute(query, params).fetchall()
    conn.close()

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
                    "mitre": {
                        "tactic": row["mitre_tactic"],
                        "technique_id": row["mitre_technique_id"],
                        "technique_name": row["mitre_technique_name"],
                    },
                }
            )

    return list(events.values())


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
