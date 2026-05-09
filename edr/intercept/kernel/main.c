#include "vmlinux.h"
#include <bpf/bpf_helpers.h>
#include <bpf/bpf_core_read.h>
#include <bpf/bpf_tracing.h>
#include <bpf/bpf_endian.h>

#include "events.h"

char LICENSE[] SEC("license") = "GPL";

struct {
    __uint(type, BPF_MAP_TYPE_RINGBUF);
    __uint(max_entries, 256 * 1024);
} events SEC(".maps");

// Ignore DNS noise
static __always_inline bool is_dns_port(u16 port)
{
    return port == 53;
}

SEC("lsm/socket_connect")
int BPF_PROG(net_sec,
             struct socket *sock,
             struct sockaddr *address,
             int addrlen)
{
    struct event *e;

    if (!address)
        return 0;

    if (address->sa_family != AF_INET)
        return 0;

    struct sockaddr_in *addr_in =
        (struct sockaddr_in *)address;

    u16 port =
        bpf_ntohs(BPF_CORE_READ(addr_in, sin_port));

    if (is_dns_port(port))
        return 0;

    e = bpf_ringbuf_reserve(&events, sizeof(*e), 0);
    if (!e)
        return 0;

    __builtin_memset(e, 0, sizeof(*e));

    // meta
    e->pid = bpf_get_current_pid_tgid() >> 32;

    u64 uid_gid = bpf_get_current_uid_gid();
    e->uid = (u32)uid_gid;
    e->gid = (u32)(uid_gid >> 32);

    e->kernel_time = bpf_ktime_get_ns();

    bpf_get_current_comm(&e->comm, sizeof(e->comm));

    struct task_struct *task =
        (struct task_struct *)bpf_get_current_task();

    struct task_struct *parent =
        BPF_CORE_READ(task, real_parent);

    e->ppid =
        parent ? BPF_CORE_READ(parent, tgid) : 0;

    e->source = LSM_SOCKET_CONNECT;
    e->action = 0; // eventually could be used to block at the kernel level 

    e->family = AF_INET;

    // network data 
    e->remote_ip4 =
        BPF_CORE_READ(addr_in, sin_addr.s_addr);

    e->remote_port = port;

    bpf_ringbuf_submit(e, 0);
    return 0;
}

SEC("tracepoint/syscalls/sys_enter_openat")
int trace_openat(struct trace_event_raw_sys_enter *ctx)
{
    struct event *e;

    const char *filename =
        (const char *)ctx->args[1];

    if (!filename)
        return 0;

    e = bpf_ringbuf_reserve(&events, sizeof(*e), 0);
    if (!e)
        return 0;

    __builtin_memset(e, 0, sizeof(*e));

    // meta 
    e->pid = bpf_get_current_pid_tgid() >> 32;

    u64 uid_gid = bpf_get_current_uid_gid();
    e->uid = (u32)uid_gid;
    e->gid = (u32)(uid_gid >> 32);

    e->kernel_time = bpf_ktime_get_ns();

    bpf_get_current_comm(&e->comm, sizeof(e->comm));

    struct task_struct *task =
        (struct task_struct *)bpf_get_current_task();

    struct task_struct *parent =
        BPF_CORE_READ(task, real_parent);

    e->ppid =
        parent ? BPF_CORE_READ(parent, tgid) : 0;

    // file meta 
    bpf_probe_read_user_str(
        e->filename,
        sizeof(e->filename),
        filename
    );

    e->source = TRACE_FILE_OPEN;
    e->action = 0;  

    bpf_ringbuf_submit(e, 0);
    return 0;
}
