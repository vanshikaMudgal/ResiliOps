#!/usr/bin/env bash
# ResiliOps - Check Health & Status of All Components

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"
cd "$PROJECT_ROOT"

echo "======================================================"
echo "  ResiliOps Component Status Checker                  "
echo "======================================================"

check_endpoint() {
    local name="$1"
    local url="$2"
    local expected_code="${3:-200}"

    local code
    code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 "$url" 2>/dev/null || echo "DOWN")

    if [ "$code" = "$expected_code" ]; then
        printf "  %-24s : [  OK  ] (HTTP %s) -> %s\n" "$name" "$code" "$url"
    else
        printf "  %-24s : [ FAIL ] (HTTP %s) -> %s\n" "$name" "$code" "$url"
    fi
}

echo "[1] Checking Container States:"
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "Docker compose is not running."
echo ""

echo "[2] Probing Service Endpoints:"
check_endpoint "React Frontend" "http://localhost:5173/health" 200
check_endpoint "FastAPI Backend" "http://localhost:8000/api/health" 200
check_endpoint "Sample Microservice" "http://localhost:8001/health" 200
check_endpoint "Prometheus Scraper" "http://localhost:9090/-/healthy" 200
check_endpoint "Grafana Dashboard" "http://localhost:3000/api/health" 200
echo ""

echo "[3] Telemetry & Recovery Overview:"
if curl -s http://localhost:8000/api/monitoring/overview >/dev/null 2>&1; then
    curl -s http://localhost:8000/api/monitoring/overview | jq '{health_score: .system_health_score, total_apps: .total_applications, healthy: .healthy_applications, down: .down_applications, active_incidents: .active_incidents, cpu_percent: .host_cpu_percent, ram_percent: .host_memory_percent}' 2>/dev/null || true
else
    echo "  Control plane API is not responding to telemetry overview."
fi
echo "======================================================"
