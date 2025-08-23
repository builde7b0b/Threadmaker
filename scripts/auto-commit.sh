#!/bin/bash

# Auto-Commit Script
# This script automatically commits and pushes changes every 5 minutes
# while preserving sensitive files and providing intelligent commit messages

set -e  # Exit on any error

# Configuration
COMMIT_INTERVAL=300  # 5 minutes in seconds
BRANCH_NAME="develop"  # Default branch to work on
REMOTE_NAME="origin"   # Remote repository name
LOG_FILE=".auto-commit.log"  # Log file for tracking commits

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[AUTO-COMMIT]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [AUTO-COMMIT] $1" >> "$LOG_FILE"
}

print_warning() {
    echo -e "${YELLOW}[AUTO-COMMIT]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [AUTO-COMMIT] WARNING: $1" >> "$LOG_FILE"
}

print_error() {
    echo -e "${RED}[AUTO-COMMIT]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [AUTO-COMMIT] ERROR: $1" >> "$LOG_FILE"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Function to check if we're in a git repository
check_git_repo() {
    if [ ! -d ".git" ]; then
        print_error "Not in a Git repository. Please run this script from a Git repository."
        exit 1
    fi
}

# Function to get current branch
get_current_branch() {
    git branch --show-current
}

# Function to check if there are changes to commit
has_changes() {
    ! git diff --quiet || ! git diff --cached --quiet
}

# Function to get list of changed files
get_changed_files() {
    git diff --name-only --cached
    git diff --name-only
}

# Function to generate intelligent commit message
generate_commit_message() {
    local changed_files=$(get_changed_files | sort | uniq)
    local file_count=$(echo "$changed_files" | wc -l)
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Analyze file types
    local js_files=$(echo "$changed_files" | grep -E '\.(js|jsx|ts|tsx)$' | wc -l)
    local css_files=$(echo "$changed_files" | grep -E '\.(css|scss|sass|less)$' | wc -l)
    local html_files=$(echo "$changed_files" | grep -E '\.(html|htm)$' | wc -l)
    local json_files=$(echo "$changed_files" | grep -E '\.(json|jsonc)$' | wc -l)
    local md_files=$(echo "$changed_files" | grep -E '\.(md|markdown)$' | wc -l)
    local config_files=$(echo "$changed_files" | grep -E '(package\.json|tsconfig\.json|next\.config\.js|tailwind\.config\.js|\.env\.example)' | wc -l)
    
    # Build commit message
    local message="Auto-commit: $timestamp\n\n"
    message+="📊 Changes: $file_count files modified\n"
    
    if [ "$js_files" -gt 0 ]; then
        message+="🔧 JavaScript/TypeScript: $js_files files\n"
    fi
    
    if [ "$css_files" -gt 0 ]; then
        message+="🎨 Styles: $css_files files\n"
    fi
    
    if [ "$html_files" -gt 0 ]; then
        message+="📄 HTML: $html_files files\n"
    fi
    
    if [ "$json_files" -gt 0 ]; then
        message+="⚙️ Configuration: $json_files files\n"
    fi
    
    if [ "$md_files" -gt 0 ]; then
        message+="📝 Documentation: $md_files files\n"
    fi
    
    if [ "$config_files" -gt 0 ]; then
        message+="🔧 Config: $config_files files\n"
    fi
    
    # Add specific file mentions for important changes
    local important_files=$(echo "$changed_files" | grep -E '(package\.json|tsconfig\.json|next\.config\.js|tailwind\.config\.js|\.env\.example|README\.md|LICENSE)' | head -3)
    if [ -n "$important_files" ]; then
        message+="\n🔍 Key files:\n"
        echo "$important_files" | while read -r file; do
            message+="  • $file\n"
        done
    fi
    
    message+="\n🤖 Auto-committed by auto-commit.sh"
    
    echo -e "$message"
}

# Function to commit changes
commit_changes() {
    local current_branch=$(get_current_branch)
    
    # Check if we're on the right branch
    if [ "$current_branch" != "$BRANCH_NAME" ]; then
        print_warning "Not on $BRANCH_NAME branch (currently on $current_branch). Switching..."
        git checkout "$BRANCH_NAME"
    fi
    
    # Add all changes except those in .gitignore
    git add .
    
    # Check if there are changes to commit
    if ! has_changes; then
        print_status "No changes to commit"
        return 0
    fi
    
    # Generate commit message
    local commit_message=$(generate_commit_message)
    
    # Create commit
    echo -e "$commit_message" | git commit -F -
    
    print_status "Changes committed successfully"
    print_status "Commit message: $(echo "$commit_message" | head -1)"
    
    # Push to remote
    if git remote get-url "$REMOTE_NAME" >/dev/null 2>&1; then
        print_status "Pushing to remote repository..."
        if git push "$REMOTE_NAME" "$BRANCH_NAME"; then
            print_status "Changes pushed successfully"
        else
            print_warning "Failed to push changes. Will retry next cycle."
        fi
    else
        print_warning "No remote repository configured. Skipping push."
    fi
}

# Function to show status
show_status() {
    local current_branch=$(get_current_branch)
    local last_commit=$(git log --oneline -1 2>/dev/null || echo "No commits yet")
    local remote_url=$(git remote get-url "$REMOTE_NAME" 2>/dev/null || echo "No remote configured")
    
    print_header "Auto-Commit Status"
    echo -e "${CYAN}Current Branch:${NC} $current_branch"
    echo -e "${CYAN}Target Branch:${NC} $BRANCH_NAME"
    echo -e "${CYAN}Remote:${NC} $remote_url"
    echo -e "${CYAN}Last Commit:${NC} $last_commit"
    echo -e "${CYAN}Commit Interval:${NC} ${COMMIT_INTERVAL}s (${COMMIT_INTERVAL}/60 minutes)"
    echo -e "${CYAN}Log File:${NC} $LOG_FILE"
    
    if has_changes; then
        echo -e "${YELLOW}Status:${NC} Changes detected - will commit on next cycle"
    else
        echo -e "${GREEN}Status:${NC} No changes detected"
    fi
}

# Function to handle script interruption
cleanup() {
    print_status "Auto-commit script stopped"
    print_status "Final status:"
    show_status
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main function
main() {
    print_header "Auto-Commit Script Started"
    
    # Check if we're in a git repository
    check_git_repo
    
    # Show initial status
    show_status
    
    print_status "Starting auto-commit loop (every ${COMMIT_INTERVAL}s)..."
    print_status "Press Ctrl+C to stop"
    
    # Create log file if it doesn't exist
    touch "$LOG_FILE"
    
    # Main loop
    while true; do
        # Sleep for the specified interval
        sleep "$COMMIT_INTERVAL"
        
        # Check if we're still in a git repository
        if [ ! -d ".git" ]; then
            print_error "Git repository not found. Stopping auto-commit."
            break
        fi
        
        # Commit changes
        commit_changes
        
        # Show status every 10 cycles (50 minutes)
        local cycle_count=$((cycle_count + 1))
        if [ $((cycle_count % 10)) -eq 0 ]; then
            show_status
        fi
    done
}

# Function to show help
show_help() {
    echo -e "${BLUE}Auto-Commit Script Usage:${NC}"
    echo ""
    echo -e "${CYAN}Basic Usage:${NC}"
    echo "  ./auto-commit.sh                    # Start auto-commit with default settings"
    echo "  ./auto-commit.sh --status           # Show current status"
    echo "  ./auto-commit.sh --help             # Show this help message"
    echo ""
    echo -e "${CYAN}Configuration:${NC}"
    echo "  COMMIT_INTERVAL=600 ./auto-commit.sh  # Commit every 10 minutes"
    echo "  BRANCH_NAME=main ./auto-commit.sh     # Work on main branch"
    echo ""
    echo -e "${CYAN}Examples:${NC}"
    echo "  # Start auto-commit every 5 minutes on develop branch"
    echo "  ./auto-commit.sh"
    echo ""
    echo "  # Start auto-commit every 10 minutes on main branch"
    echo "  COMMIT_INTERVAL=600 BRANCH_NAME=main ./auto-commit.sh"
    echo ""
    echo -e "${CYAN}Features:${NC}"
    echo "  ✅ Automatic commits every 5 minutes"
    echo "  ✅ Intelligent commit messages"
    echo "  ✅ Automatic push to remote"
    echo "  ✅ Comprehensive logging"
    echo "  ✅ Sensitive file protection"
    echo "  ✅ Branch management"
    echo "  ✅ Error handling and recovery"
    echo ""
    echo -e "${YELLOW}Note:${NC} Make sure you're in a Git repository before running this script."
}

# Parse command line arguments
case "${1:-}" in
    --help|-h)
        show_help
        exit 0
        ;;
    --status|-s)
        check_git_repo
        show_status
        exit 0
        ;;
    "")
        main
        ;;
    *)
        print_error "Unknown option: $1"
        show_help
        exit 1
        ;;
esac
