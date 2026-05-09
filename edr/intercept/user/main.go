package main

import (
	"bytes"
	"database/sql"
	"encoding/binary"
	"fmt"
	"log"
	"time"

	"intercept/user/db"
	"intercept/user/detect"
	"intercept/user/normalize"
	"intercept/user/types"

	_ "modernc.org/sqlite"

	"github.com/cilium/ebpf/link"
	"github.com/cilium/ebpf/ringbuf"
)

const DefaultDBPath = "/var/lib/intercept/events.db"

// hardcoding device data for now
const (
	DeviceID   uint32 = 1
	DeviceName        = "SAAS_SERVER"
	OSName            = "ubuntu"
	OSVersion         = "26.04"
)

func buildDevice() types.DeviceData {
    return types.DeviceData{
        DeviceId:   DeviceID,
        DeviceName: DeviceName,
        OsName:     OSName,
        OsVersion:  OSVersion,
    }
}


func main() {
	database, err := sql.Open("sqlite", DefaultDBPath)
	if err != nil {
		log.Fatalf("db init: %v", err)
	}
	defer database.Close()

	database.SetMaxOpenConns(1)

	var objs interceptObjects
	if err := loadInterceptObjects(&objs, nil); err != nil {
		log.Fatalf("loading objects: %v", err)
	}
	defer objs.Close()

	// eBPF: attach 
	sysTraceOpen, err := link.Tracepoint(
		"syscalls",
		"sys_enter_openat",
		objs.TraceOpenat,
		nil,
	)
	if err != nil {
		log.Fatalf("attach openat tracepoint: %v", err)
	}
	defer sysTraceOpen.Close()

	netSec, err := link.AttachLSM(link.LSMOptions{
		Program: objs.NetSec,
	})
	if err != nil {
		log.Fatalf("attach net_sec LSM: %v", err)
	}
	defer netSec.Close()

	// process ring buf 
	rb, err := ringbuf.NewReader(objs.Events)
	if err != nil {
		log.Fatalf("ringbuf: %v", err)
	}
	defer rb.Close()

	device := buildDevice()

	fmt.Println("Intercept is now running.")

	for {
		record, err := rb.Read()
		if err != nil {
			log.Fatalf("ringbuf read: %v", err)
		}

		var ke types.KernelEvent

		if err := binary.Read(
			bytes.NewReader(record.RawSample),
			binary.LittleEndian,
			&ke,
		); err != nil {
			log.Printf("decode error: %v", err)
			continue
		}

		// normalize
		ev := normalize.Normalize(ke)

		// detect
		detections := detect.Run(ev)

		// enrich 
		e := types.EnrichedEvent{
			Event:      ev,
			DeviceData: device,

			Timestamp: time.Now().UTC().Format(time.RFC3339Nano),

			Suspicious: len(detections) > 0,
			Detections: detections,
		}

		// persist		
		if err := db.SaveEvent(database, &e); err != nil {
			log.Printf("db insert error: %v", err)
		}
	}
}
