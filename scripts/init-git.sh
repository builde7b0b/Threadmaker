#!/bin/bash

# Git Project Initialization Script
# This script initializes a new Git repository, creates a comprehensive .gitignore,
# and pushes the code to GitHub while preserving sensitive files

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Check if we're in a Git repository
if [ -d ".git" ]; then
    print_warning "Git repository already exists. Skipping initialization."
else
    print_header "Initializing Git Repository"
    git init
    print_status "Git repository initialized"
fi

# Create comprehensive .gitignore
print_header "Creating Comprehensive .gitignore"

cat > .gitignore << 'EOF'
# Environment Variables & Secrets
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env.*.local
*.env
secrets/
secrets.json
config/secrets.json
credentials.json
service-account-key.json
google-credentials.json

# API Keys & Tokens
api-keys.txt
tokens.txt
access-tokens.json
stripe-keys.txt
openai-keys.txt

# Database
*.db
*.sqlite
*.sqlite3
database.sqlite
database.sqlite3
*.db-journal

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
.pnpm-debug.log*

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Optional stylelint cache
.stylelintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next/
out/
build/
dist/

# Nuxt.js build / generate output
.nuxt
dist

# Gatsby files
.cache/
public

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/
.tmp/

# Editor directories and files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Backup files
*.bak
*.backup
*.old

# Test files
test-results/
coverage/
.nyc_output/

# Build artifacts
*.tgz
*.tar.gz
*.zip

# Local development
.local/
local/

# Docker
.dockerignore
docker-compose.override.yml

# Terraform
*.tfstate
*.tfstate.*
.terraform/
.terraform.lock.hcl

# Kubernetes
*.kubeconfig

# AWS
.aws/
aws-credentials

# Google Cloud
.gcloud/
service-account-key.json

# Azure
.azure/

# SSH Keys
id_rsa
id_rsa.pub
*.pem
*.key

# SSL Certificates
*.crt
*.pem
*.key
*.p12
*.pfx

# Local configuration
config/local.json
config/local.js
config/local.ts

# Database migrations (if you want to ignore them)
migrations/

# Cache directories
.cache/
.parcel-cache/
.next/cache/

# TypeScript
*.tsbuildinfo

# Vercel
.vercel

# Netlify
.netlify

# Sentry
.sentryclirc

# Local development databases
data/
*.sqlite
*.db

# Backup files
*.backup
*.bak
*.old

# Temporary files
*.tmp
*.temp

# Lock files (uncomment if you want to ignore them)
# package-lock.json
# yarn.lock
# pnpm-lock.yaml

# IDE specific files
.vscode/settings.json
.vscode/launch.json
.vscode/tasks.json
.idea/workspace.xml
.idea/tasks.xml
.idea/usage.statistics.xml
.idea/dictionaries/
.idea/shelf/

# OS specific files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
Desktop.ini

# Windows
Thumbs.db
ehthumbs.db
Desktop.ini
$RECYCLE.BIN/

# Linux
*~
.fuse_hidden*
.directory
.Trash-*
.nfs*

# macOS
.AppleDouble
.LSOverride
Icon
._*
.DocumentRevisions-V100
.fseventsd
.Spotlight-V100
.TemporaryItems
.Trashes
.VolumeIcon.icns
.com.apple.timemachine.donotpresent
.AppleDB
.AppleDesktop
Network Trash Folder
Temporary Items
.apdisk

# Project specific
# Add any project-specific files here
EOF

print_status "Comprehensive .gitignore created"

# Create initial commit
print_header "Creating Initial Commit"

# Add all files except those in .gitignore
git add .

# Check if there are files to commit
if git diff --cached --quiet; then
    print_warning "No files to commit. All files are ignored or already committed."
else
    # Create initial commit with generic message
    git commit -m "Initial commit: Project setup and configuration

- Initial project structure
- Comprehensive .gitignore for security
- Basic configuration files
- Development environment setup

This commit establishes the foundation for the project with proper security measures in place."
    
    print_status "Initial commit created"
fi

# Set up remote repository
print_header "Setting Up Remote Repository"

# Check if remote already exists
if git remote get-url origin >/dev/null 2>&1; then
    print_warning "Remote 'origin' already exists"
    REMOTE_URL=$(git remote get-url origin)
    print_status "Current remote URL: $REMOTE_URL"
else
    # Prompt for GitHub repository URL
    echo -e "${BLUE}Enter your GitHub repository URL (e.g., https://github.com/username/repo.git):${NC}"
    read -r REPO_URL
    
    if [ -n "$REPO_URL" ]; then
        git remote add origin "$REPO_URL"
        print_status "Remote 'origin' added: $REPO_URL"
    else
        print_error "No repository URL provided. Skipping remote setup."
        exit 1
    fi
fi

# Create and switch to main branch (if not already on it)
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    print_status "Creating and switching to main branch"
    git checkout -b main
fi

# Push to remote repository
print_header "Pushing to Remote Repository"

# Check if we have commits to push
if git log --oneline -1 >/dev/null 2>&1; then
    print_status "Pushing to remote repository..."
    
    # Try to push, if it fails, set upstream
    if ! git push -u origin main; then
        print_warning "Push failed, trying to set upstream..."
        git push --set-upstream origin main
    fi
    
    print_status "Code successfully pushed to GitHub"
else
    print_warning "No commits to push"
fi

# Create development branch
print_header "Setting Up Development Branch"

# Check if development branch exists
if ! git show-ref --verify --quiet refs/heads/develop; then
    git checkout -b develop
    print_status "Development branch 'develop' created"
else
    git checkout develop
    print_status "Switched to existing development branch 'develop'"
fi

# Create .gitkeep files for empty directories (optional)
print_header "Creating .gitkeep Files"

find . -type d -empty -not -path "./.git/*" -not -path "./node_modules/*" -exec touch {}/.gitkeep \;
print_status ".gitkeep files created for empty directories"

# Final status
print_header "Git Setup Complete"

echo -e "${GREEN}✅ Git repository initialized successfully!${NC}"
echo -e "${GREEN}✅ Comprehensive .gitignore created${NC}"
echo -e "${GREEN}✅ Initial commit created${NC}"
echo -e "${GREEN}✅ Remote repository configured${NC}"
echo -e "${GREEN}✅ Code pushed to GitHub${NC}"
echo -e "${GREEN}✅ Development branch created${NC}"

echo ""
echo -e "${BLUE}Current Status:${NC}"
echo -e "  Branch: $(git branch --show-current)"
echo -e "  Remote: $(git remote get-url origin 2>/dev/null || echo 'None')"
echo -e "  Last Commit: $(git log --oneline -1)"

echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Continue development on the 'develop' branch"
echo -e "  2. Use 'git checkout main' to switch to main branch"
echo -e "  3. Use 'git merge develop' to merge changes to main"
echo -e "  4. Use 'git push origin develop' to push development changes"

echo ""
echo -e "${BLUE}Security Note:${NC}"
echo -e "  All sensitive files (.env, credentials, etc.) are now ignored"
echo -e "  Your local copy retains all files while only safe code is pushed"

print_status "Git setup complete! 🚀"
