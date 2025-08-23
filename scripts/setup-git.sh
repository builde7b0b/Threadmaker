#!/bin/bash

# Git Setup Convenience Script
# This script makes the Git scripts executable and provides easy access

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[SETUP]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Make scripts executable
print_header "Making Git Scripts Executable"

chmod +x scripts/init-git.sh
chmod +x scripts/auto-commit.sh
chmod +x scripts/setup-git.sh

print_status "All scripts are now executable"

# Create symlinks in project root for easy access
print_header "Creating Convenience Links"

# Create symlinks if they don't exist
if [ ! -L "init-git" ]; then
    ln -sf scripts/init-git.sh init-git
    print_status "Created symlink: init-git -> scripts/init-git.sh"
fi

if [ ! -L "auto-commit" ]; then
    ln -sf scripts/auto-commit.sh auto-commit
    print_status "Created symlink: auto-commit -> scripts/auto-commit.sh"
fi

print_status "Convenience links created"

# Show usage information
print_header "Git Scripts Setup Complete"

echo -e "${GREEN}✅ All scripts are now executable and ready to use!${NC}"
echo ""
echo -e "${BLUE}Available Commands:${NC}"
echo -e "  ${YELLOW}./init-git${NC}                    # Initialize Git repository and push to GitHub"
echo -e "  ${YELLOW}./auto-commit${NC}                 # Start automatic commits every 5 minutes"
echo -e "  ${YELLOW}./auto-commit --status${NC}        # Show auto-commit status"
echo -e "  ${YELLOW}./auto-commit --help${NC}          # Show auto-commit help"
echo ""
echo -e "${BLUE}Or use the full paths:${NC}"
echo -e "  ${YELLOW}./scripts/init-git.sh${NC}         # Initialize Git repository"
echo -e "  ${YELLOW}./scripts/auto-commit.sh${NC}      # Start automatic commits"
echo ""
echo -e "${BLUE}Configuration Examples:${NC}"
echo -e "  ${YELLOW}COMMIT_INTERVAL=600 ./auto-commit${NC}  # Commit every 10 minutes"
echo -e "  ${YELLOW}BRANCH_NAME=main ./auto-commit${NC}     # Work on main branch"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Run ${GREEN}./init-git${NC} to set up your Git repository"
echo -e "  2. Run ${GREEN}./auto-commit${NC} to start automatic commits"
echo -e "  3. Focus on coding while your changes are automatically saved!"
echo ""
print_status "Setup complete! 🚀"
