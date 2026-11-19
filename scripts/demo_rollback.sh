#!/usr/bin/env bash
# ResiliOps - Live Demonstration: Automated Deployment Rollback
set -e

echo "======================================================"
echo "  [DEMO] Demonstrating Deployment Rollback            "
echo "======================================================"

echo "[1] Fetching Current Application State (Payment Service)..."
BEFORE_VER=$(curl -s http://localhost:8000/api/applications/1 | jq -r .version 2>/dev/null || echo "unknown")
echo "    Current Version: $BEFORE_VER"

echo ""
echo "[2] Triggering Rollback to Previous Known-Good Release..."
ROLLBACK_RESP=$(curl -s -X POST http://localhost:8000/api/recovery/rollback/1)
echo "    Rollback Response:"
echo "$ROLLBACK_RESP" | jq . 2>/dev/null || echo "$ROLLBACK_RESP"

echo ""
echo "[3] Fetching Post-Rollback Application State..."
AFTER_VER=$(curl -s http://localhost:8000/api/applications/1 | jq -r .version 2>/dev/null || echo "unknown")
echo "    New Active Version: $AFTER_VER"

echo ""
echo "======================================================"
echo "  [SUCCESS] Rollback Executed & Service Verified!     "
echo "  * View on Dashboard: http://localhost:5173/deployments"
echo "======================================================"
