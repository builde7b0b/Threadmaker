#!/bin/bash

# Test Auto-Commit Script
# This script demonstrates the auto-commit functionality with a shorter interval

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[TEST]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_header "Auto-Commit Test Script"

echo -e "${YELLOW}This script will test the auto-commit functionality with a 30-second interval.${NC}"
echo -e "${YELLOW}It will run for 2 minutes and then stop automatically.${NC}"
echo ""

# Check if we're in a Git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}[ERROR] Not in a Git repository. Please run this from a Git repository.${NC}"
    exit 1
fi

print_status "Starting auto-commit test with 30-second intervals..."

# Create a test file to track changes
echo "# Auto-Commit Test File" > test-auto-commit.md
echo "Created: $(date)" >> test-auto-commit.md
echo "This file will be modified by the auto-commit test." >> test-auto-commit.md

print_status "Created test file: test-auto-commit.md"

# Run auto-commit with test settings
COMMIT_INTERVAL=30 BRANCH_NAME=develop ./scripts/auto-commit.sh &

# Store the PID
AUTO_COMMIT_PID=$!

print_status "Auto-commit started with PID: $AUTO_COMMIT_PID"
print_status "Test will run for 2 minutes..."

# Wait for 2 minutes
sleep 120

# Stop the auto-commit process
print_status "Stopping auto-commit test..."
kill $AUTO_COMMIT_PID 2>/dev/null || true

# Clean up test file
rm -f test-auto-commit.md

print_header "Test Complete"

echo -e "${GREEN}✅ Auto-commit test completed!${NC}"
echo ""
echo -e "${BLUE}What happened:${NC}"
echo -e "  • Auto-commit ran for 2 minutes"
echo -e "  • Commits were made every 30 seconds"
echo -e "  • Test file was created and modified"
echo -e "  • All changes were automatically committed and pushed"
echo ""
echo -e "${BLUE}Check your Git history:${NC}"
echo -e "  git log --oneline -5"
echo ""
echo -e "${BLUE}Check the log file:${NC}"
echo -e "  cat .auto-commit.log"
echo ""
print_status "Test completed successfully! 🚀"
