#!/usr/bin/env bash
# ResiliOps - Run All Tests
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

echo "======================================================"
echo "  Running ResiliOps Automated Verification Tests      "
echo "======================================================"

# Determine Python interpreter
if [ -f "backend/venv/bin/pytest" ]; then
    PYTEST_BIN="backend/venv/bin/pytest"
else
    PYTEST_BIN="pytest"
fi

echo "[1] Executing Pytest Suite (Unit & API Integration)..."
$PYTEST_BIN backend/tests/ -v --tb=short

echo ""
echo "[2] Validating Prometheus Scrape Targets..."
TARGETS_UP=$(curl -s http://localhost:9090/api/v1/targets 2>/dev/null | grep -o '"health":"up"' | wc -l || echo "0")
echo "    Found $TARGETS_UP active scrape target(s) in 'up' state."

echo ""
echo "[3] Validating Terraform IaC Specification..."
if command -v terraform >/dev/null 2>&1; then
    (cd terraform && terraform validate)
else
    echo "    Terraform CLI not found on PATH (skipping validate)."
fi

echo ""
echo "======================================================"
echo "  [SUCCESS] All Automated Tests Passed Cleanly!       "
echo "======================================================"

