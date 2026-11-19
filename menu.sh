#!/usr/bin/env bash
# ResiliOps - Master Examination Control Menu
# Run this script for a one-click interactive demonstration in front of faculty!

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for terminal output
BOLD="\033[1m"
GREEN="\033[32m"
BLUE="\033[34m"
CYAN="\033[36m"
YELLOW="\033[33m"
RESET="\033[0m"

clear_screen() {
    clear 2>/dev/null || true
}

open_browser() {
    local url="$1"
    if command -v xdg-open >/dev/null 2>&1; then
        xdg-open "$url" >/dev/null 2>&1 &
    elif command -v google-chrome >/dev/null 2>&1; then
        google-chrome "$url" >/dev/null 2>&1 &
    else
        echo "Please open in your browser: $url"
    fi
}

while true; do
    echo -e "${BOLD}${CYAN}==============================================================${RESET}"
    echo -e "${BOLD}${CYAN}     ResiliOps – College Project Examination Control Panel    ${RESET}"
    echo -e "${BOLD}${CYAN}==============================================================${RESET}"
    echo -e " ${BOLD}1)${RESET} ${GREEN}Start Entire Platform${RESET} (Docker Compose up)"
    echo -e " ${BOLD}2)${RESET} ${BLUE}Check System Status & Service URLs${RESET}"
    echo -e " ${BOLD}3)${RESET} ${YELLOW}Run Automated Pytest & Verification Tests${RESET}"
    echo -e " ${BOLD}4)${RESET} Simulate Failure (Crash Microservice -> Detect Incident)"
    echo -e " ${BOLD}5)${RESET} ${GREEN}Trigger Autonomous Self-Healing${RESET} (Restart & Resolve)"
    echo -e " ${BOLD}6)${RESET} Demonstrate Deployment Rollback"
    echo -e " ${BOLD}7)${RESET} Run Local Terraform IaC Demonstration (Apply & Teardown)"
    echo -e " ${BOLD}8)${RESET} Open Dashboard in Web Browser"
    echo -e " ${BOLD}9)${RESET} Stop Platform (Docker Compose down)"
    echo -e " ${BOLD}0)${RESET} Exit"
    echo -e "${BOLD}${CYAN}==============================================================${RESET}"
    read -rp " Select an option [0-9]: " CHOICE
    echo ""

    case "$CHOICE" in
        1)
            ./scripts/start.sh
            ;;
        2)
            ./scripts/status.sh
            ;;
        3)
            ./scripts/test.sh
            ;;
        4)
            ./scripts/demo_failure.sh
            ;;
        5)
            ./scripts/demo_heal.sh
            ;;
        6)
            ./scripts/demo_rollback.sh
            ;;
        7)
            ./scripts/demo_terraform.sh
            ;;
        8)
            echo "Opening React Dashboard at http://localhost:5173 ..."
            open_browser "http://localhost:5173"
            ;;
        9)
            ./scripts/stop.sh
            ;;
        0)
            echo "Exiting ResiliOps Control Panel. Good luck with your examination!"
            exit 0
            ;;
        *)
            echo "Invalid selection. Please choose a number between 0 and 9."
            ;;
    esac

    echo ""
    read -rp "Press [Enter] to return to the menu..." DUMMY
    clear_screen
done
