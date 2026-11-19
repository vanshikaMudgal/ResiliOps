#!/usr/bin/env bash
# Common configuration and Docker socket auto-detection for ResiliOps

# Resolve directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Auto-detect valid Docker socket
# If DOCKER_HOST points to a non-existent socket (e.g. inactive Docker Desktop), fallback to /var/run/docker.sock
if [ -n "$DOCKER_HOST" ]; then
    CURRENT_SOCK="${DOCKER_HOST#unix://}"
    if [ ! -S "$CURRENT_SOCK" ] && [ -S "/var/run/docker.sock" ]; then
        export DOCKER_HOST="unix:///var/run/docker.sock"
    fi
else
    if [ -S "/var/run/docker.sock" ]; then
        export DOCKER_HOST="unix:///var/run/docker.sock"
    fi
fi
