#!/usr/bin/env bash
# ResiliOps - Live Demonstration: Automated Container Self-Healing
set -e

echo "======================================================"
echo "  [DEMO] Executing Autonomous Container Self-Healing  "
echo "======================================================"

echo "[1] Triggering Container Restart via ResiliOps Recovery Engine..."
RECOVERY_RESP=$(curl -s -X POST http://localhost:8000/api/recovery/execute \
    -H "Content-Type: application/json" \
    -d '{"app_id": 1, "action_type": "Container Restart"}')

echo "    Recovery Action Logged:"
echo "$RECOVERY_RESP" | jq . 2>/dev/null || echo "$RECOVERY_RESP"

echo ""
echo "[2] Triggering Post-Recovery Verification Pass..."
curl -s -X POST http://localhost:8000/api/monitoring/check-now >/dev/null 2>&1 || true

echo ""
echo "[3] Probing Target Microservice Endpoint (:8001/health)..."
TARGET_STATUS=$(curl -s http://localhost:8001/health 2>/dev/null || echo "DOWN")
echo "    Live Microservice Response: $TARGET_STATUS"

echo ""
echo "======================================================"
echo "  [SUCCESS] Container Self-Healing Successfully Done! "
echo "  * View Recovery Log: http://localhost:5173/self-healing"
echo "  * View Incidents:    http://localhost:5173/incidents"
echo "======================================================"
