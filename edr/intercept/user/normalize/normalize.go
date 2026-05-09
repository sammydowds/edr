package normalize

import (
	"intercept/user/types"
	"intercept/user/utils"
)

func Normalize(ke types.KernelEvent) types.Event {
    return types.Event{
        KernelTime: ke.KernelTime,

        Pid: ke.Pid,
        Ppid: ke.Ppid,
        Uid: ke.Uid,
        Gid: ke.Gid,

        Source: ke.Source,
        Action: ke.Action,

        Family: ke.Family,

        RemoteIP4: utils.IPToString(ke.RemoteIP4),
        RemotePort: ke.RemotePort,

        Comm: utils.CString(ke.Comm[:]),
        Filename: utils.CString(ke.Filename[:]),
    }
}
