# Intercept 

Kernel 🤝🏻 User Space

Monitor, capture, and block suspicious actions with eBPF and a user space consumer that writes events to a database in real time.

## System Requirements

For this project I utilized the following system to work with linux development.

```
Linux server 7.0.0-14-generic #14-Ubuntu SMP PREEMPT_DYNAMIC Mon Apr 13 10:52:31 UTC 2026 aarch64 GNU/Linux
```

# Architecture

TODO: diagram

## Linux: Kernel and User Space 

This MVP uses eBPF LSM hooks to create events that are consumed in the user space from a [ring buffer map](https://docs.ebpf.io/linux/map-type/BPF_MAP_TYPE_RINGBUF/). The consumer is a Go program which will consume those events and write them to a SQLITE database. 

### Build + Run Consumer (utilizes bpf2go)

Please see the `Makefile` for more details. On the target machine:
```bash
# from root
make run
```

## Database

Events are stored in a SQLITE database.

Ensure `sqlite` database file is in `/var/lib/geyser/events.db`

```bash
sudo mkdir /var/lib/geyser && sudo chown -R <service>:<service> /var/lib/gerser

# create tables/schema
sudo sqlite3 /var/lib/geyser/events.db < /edr/db/schema.sql
```

You should now see that our events table exists. 
```bash
lab@server:~/edr/user/db$ sqlite3 /var/lib/geyser/events.db
SQLite version 3.46.1 2024-08-13 09:16:08
Enter ".help" for usage hints.
sqlite> .tables
events
```

# Resources

## Real Solutions - eBPF security/observability
- [Tetragon](https://tetragon.io/docs/)
- [Falco](https://falco.org/)
- [Tracee](https://aquasecurity.github.io/tracee/latest/)

## Learning Materials
- [eBPF](https://ebpf.io/what-is-ebpf/)
- [eBPF Ecosystem](https://ebpf.io/applications/)
- [eBPF Documentary](https://www.youtube.com/watch?v=Wb_vD3XZYOA)
- [Linux Security Modules](https://www.kernel.org/doc/html/latest/security/lsm.html#lsm-capabilities-module)
- [eBPF security run time w/ Liz Rize](https://youtu.be/maP3ceTjugk?si=174hFDhfD2kmPRhK)
- [Intro to eBPF](https://www.youtube.com/watch?v=WVy6CtDbpR4)

## Footguns

### Ensuring BPF LSM is enabled

```bash
cat /sys/kernel/security/lsm

--> Should ouput some list with bpf
```

If not, update Grub settings, and reboot 
```bash
sudo vim /etc/default/grub

# update below
GRUB_CMDLINE_LINUX_DEFAULT="quiet splash lsm=lockdown,capability,bpf,yama"

# then update and restart
sudo update-grub
sudo reboot
```
