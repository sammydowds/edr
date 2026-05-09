-- intercept events schema
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
-- EVENTS table
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  -- timing
  kernel_time INTEGER,
  timestamp TEXT NOT NULL,
  -- host metadata
  device_id INTEGER,
  device_name TEXT,
  os_name TEXT,
  os_version TEXT,
  -- process metadata
  pid INTEGER,
  ppid INTEGER,
  uid INTEGER,
  gid INTEGER,
  -- process identity
  comm TEXT,
  filename TEXT,
  cmdline TEXT,
  cwd TEXT,
  -- event classification
  source INTEGER,
  action INTEGER,
  -- network
  family INTEGER,
  remote_ip4 TEXT,
  remote_port INTEGER,
  -- event state
  suspicious INTEGER DEFAULT 0,
  severity TEXT DEFAULT 'info'
);
-- DETECTIONS table
CREATE TABLE IF NOT EXISTS detections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  -- internal detection metadata
  rule_id TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL,
  -- MITRE ATT&CK
  mitre_tactic TEXT,
  mitre_technique_id TEXT,
  mitre_technique_name TEXT,
  -- optional extras
  confidence INTEGER DEFAULT 50,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
);
-- =========================================================
-- INDEXES
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_pid ON events(pid);
CREATE INDEX IF NOT EXISTS idx_events_uid ON events(uid);
CREATE INDEX IF NOT EXISTS idx_events_source ON events(source);
CREATE INDEX IF NOT EXISTS idx_events_comm ON events(comm);
CREATE INDEX IF NOT EXISTS idx_events_filename ON events(filename);
CREATE INDEX IF NOT EXISTS idx_events_remote_ip4 ON events(remote_ip4);
CREATE INDEX IF NOT EXISTS idx_events_suspicious ON events(suspicious);
CREATE INDEX IF NOT EXISTS idx_detections_event_id ON detections(event_id);
CREATE INDEX IF NOT EXISTS idx_detections_technique ON detections(mitre_technique_id);
CREATE INDEX IF NOT EXISTS idx_detections_rule ON detections(rule_id);
