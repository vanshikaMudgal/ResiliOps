#!/usr/bin/env bash
# ResiliOps - Live Demonstration: Failure Injection & Incident Detection
set -e

echo "======================================================"
echo "  [DEMO] Simulating Application Failure & Detection   "
echo "======================================================"

echo "[1] Sending crash payload to Sample Microservice (:8001/crash)..."
CRASH_RESP=$(curl -s -X POST http://localhost:8001/crash)
echo "    Response: $CRASH_RESP"

echo ""
echo "[2] Triggering Monitoring & Failure Detection Cycles..."
for i in 1 2 3; do
    echo "    - Executing Health Check Pass $i/3..."
    curl -s -X POST http://localhost:8000/api/monitoring/check-now >/dev/null 2>&1 || true
    sleep 1
done

echo ""
echo "[3] Checking Generated Incident in ResiliOps Control Plane:"
LATEST_INCIDENT=$(curl -sL http://localhost:8000/api/incidents | jq '.[0]' 2>/dev/null || true)

if [ -n "$LATEST_INCIDENT" ] && [ "$LATEST_INCIDENT" != "null" ]; then
    echo "$LATEST_INCIDENT"
    echo ""
    echo "======================================================"
    echo "  [SUCCESS] Incident Successfully Generated!          "
    echo "  * View on Dashboard: http://localhost:5173/incidents"
    echo "  * Next Step: Run './scripts/demo_heal.sh' to recover"
    echo "======================================================"
else
    echo "[-] Note: Check dashboard at http://localhost:5173/incidents"
fi

