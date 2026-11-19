#!/usr/bin/env bash
# ResiliOps - Start Platform
set -e

# Resolve script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"
cd "$PROJECT_ROOT"

echo "======================================================"
echo "  Starting ResiliOps Platform (Docker Compose)        "
echo "======================================================"

# Verify Docker daemon is responsive
if ! docker info >/dev/null 2>&1; then
    echo "[-] Error: Docker daemon is not accessible at $DOCKER_HOST"
    echo "    Please start Docker or check permissions."
    exit 1
fi

echo "[+] Launching multi-container stack..."
docker compose up -d

echo "[+] Waiting for backend healthcheck to become ready..."
MAX_RETRIES=20
COUNT=0
READY=false

while [ $COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:8000/api/health >/dev/null 2>&1; then
        READY=true
        break
    fi
    sleep 1
    COUNT=$((COUNT + 1))
    echo -n "."
done
echo ""

if [ "$READY" = true ]; then
    echo "======================================================"
    echo "  [SUCCESS] All ResiliOps Services Are Live!          "
    echo "======================================================"
    echo "  * React Dashboard:     http://localhost:5173"
    echo "  * FastAPI Swagger API: http://localhost:8000/docs"
    echo "  * Prometheus Metrics:  http://localhost:9090"
    echo "  * Grafana Telemetry:   http://localhost:3000 (admin / admin)"
    echo "  * Sample Microservice: http://localhost:8001/health"
    echo "======================================================"
else
    echo "[-] Warning: Backend took longer than expected to start."
    echo "    Run './scripts/status.sh' or 'docker compose logs backend' to inspect."
fi
