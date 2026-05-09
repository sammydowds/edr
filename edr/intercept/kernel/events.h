#pragma once

#define LSM_SOCKET_CONNECT 1
#define TRACE_FILE_OPEN 2 
#ifndef AF_INET
#define AF_INET  2
#endif

#define MAY_READ 0x4
#define MAY_WRITE 0x2

struct event {
    u64 kernel_time;
    u32 pid;
    u32 ppid;
    u32 uid;
    u32 gid;
    u32 source;
    u32 action;
    u32 remote_ip4;
    u16 family;
    u16 remote_port;
    char comm[16];
    char filename[256];
} __attribute__((packed));
