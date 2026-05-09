package types

type MITRE struct {
    TechniqueID   string `json:"technique_id"`
    TechniqueName string `json:"technique_name"`
    Tactic        string `json:"tactic"`
}

type Detection struct {
    RuleID      string `json:"rule_id"`
    RuleName    string `json:"rule_name"`

    Description string `json:"description"`

    Severity    string `json:"severity"`

    Confidence  int `json:"confidence"`

    MITRE       MITRE `json:"mitre"`
}

type KernelEvent struct {
    KernelTime uint64

    Pid        uint32
    Ppid       uint32
    Uid        uint32
    Gid        uint32

    Source     uint32
    Action     uint32

    RemoteIP4  uint32
    Family     uint16
    RemotePort uint16

    Comm       [16]byte
    Filename   [256]byte
}

type DeviceData struct {
    DeviceId   uint32 `json:"device_id"`

    DeviceName string `json:"device_name"`
    OsName     string `json:"os_name"`
    OsVersion  string `json:"os_version"`
}

type Event struct {
    KernelTime uint64 `json:"kernel_time"`

    Pid        uint32 `json:"pid"`
    Ppid       uint32 `json:"ppid"`
    Uid        uint32 `json:"uid"`
    Gid        uint32 `json:"gid"`

    Source     uint32 `json:"source"`
    Action     uint32 `json:"action"`

    RemoteIP4  string `json:"remote_ip4"`
    Family     uint16 `json:"family"`
    RemotePort uint16 `json:"remote_port"`

    Comm       string `json:"comm"`
    Filename   string `json:"filename"`
}

type EnrichedEvent struct {
    ID          int64 `json:"id,omitempty"`

    Timestamp   string `json:"timestamp"`

    Suspicious  bool `json:"suspicious"`

    Event

    DeviceData

    Detections  []Detection `json:"detections"`
}

const (
    LSM_SOCK_CONNECT = 1
    TRACE_FILE_OPEN = 2 

    AF_INET  = 2
    AF_INET6 = 10
)
