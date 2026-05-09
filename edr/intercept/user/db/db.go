package db

import (
	"database/sql"

	"intercept/user/types"
)

func SaveEvent(db *sql.DB, e *types.EnrichedEvent) error {

	tx, err := db.Begin()
	if err != nil {
		return err
	}

	defer tx.Rollback()

	res, err := tx.Exec(`
	INSERT INTO events (
		kernel_time, timestamp,
		device_id, device_name, os_name, os_version,
		pid, ppid, uid, gid,
		comm, filename,
		source, action,
		family, remote_ip4, remote_port,
		suspicious
	) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`,
		e.KernelTime, e.Timestamp,

		e.DeviceId, e.DeviceName, e.OsName, e.OsVersion,

		e.Pid, e.Ppid, e.Uid, e.Gid,

		e.Comm, e.Filename,

		e.Source, e.Action,

		e.Family, e.RemoteIP4, e.RemotePort,

		e.Suspicious,
	)

	if err != nil {
		return err
	}

	eventID, err := res.LastInsertId()
	if err != nil {
		return err
	}

	for _, d := range e.Detections {

		_, err := tx.Exec(`
			INSERT INTO detections (
				event_id,
				rule_id, rule_name,
				description,
				severity, confidence,
				mitre_technique_id, mitre_technique_name, mitre_tactic
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
		`,
			eventID,
			d.RuleID,
			d.RuleName,
			d.Description,
			d.Severity,
			d.Confidence,
			d.MITRE.TechniqueID,
			d.MITRE.TechniqueName,
			d.MITRE.Tactic,
		)

		if err != nil {
			return err
		}
	}

	return tx.Commit()
}
