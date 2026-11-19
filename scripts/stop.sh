#!/usr/bin/env bash
# ResiliOps - Stop Platform
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"
cd "$PROJECT_ROOT"

echo "======================================================"
echo "  Stopping ResiliOps Platform                         "
echo "======================================================"

if [ "$1" = "--clean" ]; then
    echo "[+] Stopping containers and removing persistent volumes..."
    docker compose down -v
    echo "[+] Cleaned up containers and test volumes."
else
    echo "[+] Stopping containers (preserving persistent database)..."
    docker compose down
    echo "[+] ResiliOps stopped safely."
    echo "    (Tip: Run './scripts/stop.sh --clean' if you want to reset volumes)"
fi
