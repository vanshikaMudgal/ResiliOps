#!/usr/bin/env bash
# ResiliOps - Live Demonstration: Local Terraform Infrastructure Provisioning
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TF_DIR="$PROJECT_ROOT/terraform"

echo "======================================================"
echo "  [DEMO] Terraform Local Infrastructure as Code (IaC) "
echo "======================================================"

cd "$TF_DIR"

echo "[1] Checking Terraform Initialization..."
terraform init -upgrade >/dev/null 2>&1 || terraform init

echo ""
echo "[2] Running Terraform Plan..."
terraform plan -no-color

echo ""
echo "[3] Applying Infrastructure (Creating Network & Container on port 8085)..."
terraform apply -auto-approve -no-color

echo ""
echo "[4] Probing Terraform-Provisioned Microservice (http://localhost:8085/health)..."
sleep 1
TF_APP_RESP=$(curl -s http://localhost:8085/health 2>/dev/null || echo "DOWN")
echo "    Live Response: $TF_APP_RESP"

echo ""
echo "[5] Tearing Down Terraform Resources (Clean Teardown)..."
terraform destroy -auto-approve -no-color

echo ""
echo "======================================================"
echo "  [SUCCESS] Terraform IaC Demonstration Complete!     "
echo "======================================================"
