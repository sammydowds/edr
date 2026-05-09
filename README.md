#  EDR  

A tiny EDR that I built for fun.

## Architecture

This EDR is comprised of three systems:
- Intercept: an eBPF monitoring and enforcement layer that persists events in the user space
- Lattice: an API to serve event data
- Perimeter: Frontend to view and manage EDR events
