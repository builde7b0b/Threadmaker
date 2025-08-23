# Git Automation Scripts

This directory contains powerful Git automation scripts designed to streamline your development workflow and ensure your code is always safely backed up to GitHub.

## 🚀 Quick Start

```bash
# Make scripts executable and create convenience links
./scripts/setup-git.sh

# Initialize Git repository and push to GitHub
./init-git

# Start automatic commits every 5 minutes
./auto-commit
```

## 📁 Scripts Overview

### 1. `init-git.sh` - Git Repository Initialization
**Purpose**: Initialize a new Git repository with comprehensive security and push to GitHub

**Features**:
- ✅ Comprehensive `.gitignore` for security
- ✅ Automatic initial commit with detailed message
- ✅ Remote repository setup
- ✅ Main and development branch creation
- ✅ Sensitive file protection
- ✅ Colored output and progress tracking

**Usage**:
```bash
./scripts/init-git.sh
# or
./init-git
```

**What it does**:
1. Initializes Git repository (if not already done)
2. Creates comprehensive `.gitignore` with 200+ patterns
3. Adds all non-sensitive files to staging
4. Creates detailed initial commit
5. Sets up remote repository (prompts for GitHub URL)
6. Creates and switches to `develop` branch
7. Pushes code to GitHub

### 2. `auto-commit.sh` - Automatic Commit System
**Purpose**: Automatically commit and push changes every 5 minutes

**Features**:
- ✅ Intelligent commit messages based on file types
- ✅ Automatic push to remote repository
- ✅ Comprehensive logging
- ✅ Branch management
- ✅ Error handling and recovery
- ✅ Configurable commit intervals
- ✅ Status monitoring

**Usage**:
```bash
# Start with default settings (5 minutes, develop branch)
./scripts/auto-commit.sh

# Show current status
./scripts/auto-commit.sh --status

# Show help
./scripts/auto-commit.sh --help

# Custom configuration
COMMIT_INTERVAL=600 BRANCH_NAME=main ./scripts/auto-commit.sh
```

**Configuration Options**:
- `COMMIT_INTERVAL`: Seconds between commits (default: 300 = 5 minutes)
- `BRANCH_NAME`: Branch to work on (default: "develop")
- `REMOTE_NAME`: Remote repository name (default: "origin")

### 3. `setup-git.sh` - Convenience Setup
**Purpose**: Make scripts executable and create convenience links

**Features**:
- ✅ Makes all scripts executable
- ✅ Creates symlinks for easy access
- ✅ Provides usage instructions

**Usage**:
```bash
./scripts/setup-git.sh
```

## 🔧 Configuration

### Environment Variables

You can customize the behavior using environment variables:

```bash
# Commit every 10 minutes instead of 5
COMMIT_INTERVAL=600 ./auto-commit

# Work on main branch instead of develop
BRANCH_NAME=main ./auto-commit

# Use a different remote name
REMOTE_NAME=upstream ./auto-commit

# Combine multiple settings
COMMIT_INTERVAL=600 BRANCH_NAME=main REMOTE_NAME=upstream ./auto-commit
```

### Custom Commit Intervals

```bash
# Every 2 minutes (120 seconds)
COMMIT_INTERVAL=120 ./auto-commit

# Every 10 minutes (600 seconds)
COMMIT_INTERVAL=600 ./auto-commit

# Every 30 minutes (1800 seconds)
COMMIT_INTERVAL=1800 ./auto-commit

# Every hour (3600 seconds)
COMMIT_INTERVAL=3600 ./auto-commit
```

## 📊 Intelligent Commit Messages

The auto-commit script generates intelligent commit messages based on the types of files changed:

**Example Commit Message**:
```
Auto-commit: 2024-01-15 14:30:25

📊 Changes: 8 files modified
🔧 JavaScript/TypeScript: 3 files
🎨 Styles: 2 files
⚙️ Configuration: 1 files
📝 Documentation: 2 files

🔍 Key files:
  • package.json
  • src/components/Header.tsx
  • README.md

🤖 Auto-committed by auto-commit.sh
```

## 🔒 Security Features

### Comprehensive .gitignore

The initialization script creates a `.gitignore` file that protects:

- **Environment Variables**: `.env`, `.env.local`, etc.
- **API Keys & Tokens**: `api-keys.txt`, `tokens.txt`, etc.
- **Database Files**: `*.db`, `*.sqlite`, etc.
- **Logs**: `*.log`, `logs/`, etc.
- **Build Artifacts**: `dist/`, `build/`, `.next/`, etc.
- **IDE Files**: `.vscode/`, `.idea/`, etc.
- **OS Files**: `.DS_Store`, `Thumbs.db`, etc.
- **SSL Certificates**: `*.crt`, `*.pem`, `*.key`, etc.
- **SSH Keys**: `id_rsa`, `*.pem`, etc.
- **Cloud Credentials**: AWS, Google Cloud, Azure files

### Sensitive File Protection

The scripts automatically:
- ✅ Ignore all sensitive files during commits
- ✅ Preserve local copies of sensitive files
- ✅ Only push safe, non-sensitive code to GitHub
- ✅ Create comprehensive security patterns

## 📝 Logging

### Auto-Commit Logs

The auto-commit script creates a `.auto-commit.log` file with detailed information:

```
2024-01-15 14:30:25 [AUTO-COMMIT] Auto-Commit Script Started
2024-01-15 14:30:25 [AUTO-COMMIT] Starting auto-commit loop (every 300s)...
2024-01-15 14:35:25 [AUTO-COMMIT] Changes committed successfully
2024-01-15 14:35:26 [AUTO-COMMIT] Changes pushed successfully
```

### Git Logs

All Git operations are logged with timestamps and detailed information.

## 🎯 Use Cases

### 1. New Project Setup
```bash
# 1. Create new project directory
mkdir my-awesome-project
cd my-awesome-project

# 2. Add your project files
# ... create your project files ...

# 3. Initialize Git and push to GitHub
./init-git

# 4. Start automatic commits
./auto-commit
```

### 2. Existing Project
```bash
# 1. Navigate to existing project
cd existing-project

# 2. Set up Git automation
./setup-git.sh

# 3. Start automatic commits
./auto-commit
```

### 3. Team Development
```bash
# 1. Each team member runs auto-commit on their feature branch
BRANCH_NAME=feature/new-feature ./auto-commit

# 2. Changes are automatically committed and pushed
# 3. Team can see progress in real-time
```

## 🚨 Troubleshooting

### Common Issues

**1. "Not in a Git repository"**
```bash
# Solution: Initialize Git first
git init
./init-git
```

**2. "Permission denied"**
```bash
# Solution: Make scripts executable
chmod +x scripts/*.sh
./setup-git.sh
```

**3. "Remote repository not found"**
```bash
# Solution: Add remote repository
git remote add origin https://github.com/username/repo.git
```

**4. "Push failed"**
```bash
# Solution: Check remote URL and permissions
git remote -v
git push --set-upstream origin develop
```

### Debug Mode

Enable verbose output for debugging:

```bash
# Show detailed Git operations
GIT_TRACE=1 ./auto-commit

# Show script debugging
bash -x ./auto-commit
```

## 🔄 Workflow Integration

### Development Workflow

1. **Start Development**:
   ```bash
   ./auto-commit  # Start automatic commits
   ```

2. **Focus on Coding**:
   - Write code without worrying about commits
   - Changes are automatically saved every 5 minutes
   - Sensitive files are protected

3. **Review Changes**:
   ```bash
   ./auto-commit --status  # Check current status
   git log --oneline -10   # View recent commits
   ```

4. **Manual Commits** (when needed):
   ```bash
   # Stop auto-commit (Ctrl+C)
   # Make manual commit
   git add .
   git commit -m "Manual commit: specific feature"
   git push
   # Restart auto-commit
   ./auto-commit
   ```

### Production Deployment

1. **Development Phase**:
   ```bash
   ./auto-commit  # Automatic commits on develop branch
   ```

2. **Testing Phase**:
   ```bash
   git checkout main
   git merge develop
   git push origin main
   ```

3. **Deployment**:
   - Deploy from main branch
   - Auto-commit continues on develop branch

## 📈 Benefits

### For Developers
- ✅ Focus on coding, not Git management
- ✅ Automatic backup of work
- ✅ No lost changes due to crashes
- ✅ Intelligent commit messages
- ✅ Secure handling of sensitive files

### For Teams
- ✅ Real-time visibility of progress
- ✅ Consistent commit patterns
- ✅ Reduced merge conflicts
- ✅ Automated workflow

### For Projects
- ✅ Comprehensive security
- ✅ Professional Git history
- ✅ Easy onboarding for new developers
- ✅ Scalable workflow

## 🤝 Contributing

To improve these scripts:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

These scripts are provided as-is for educational and development purposes. Use at your own risk and ensure you understand what each script does before running it.

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section
2. Review the logs (`.auto-commit.log`)
3. Enable debug mode
4. Check Git status and remote configuration

---

**Happy coding! 🚀**
