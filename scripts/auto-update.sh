#!/bin/bash

# VoxLink Auto-Update Script
# Automatically pulls updates and restarts services

set -e

BACKUP_DIR="/backups/voxlink"
LOG_FILE="/var/log/voxlink/auto-update.log"
LOCK_FILE="/tmp/voxlink-update.lock"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if update is already running
if [ -f "$LOCK_FILE" ]; then
    error "Update already in progress"
    exit 1
fi

# Create lock file
touch "$LOCK_FILE"

# Cleanup function
cleanup() {
    rm -f "$LOCK_FILE"
}

# Set trap for cleanup
trap cleanup EXIT

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    error "Not in a git repository"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
log "Current branch: $CURRENT_BRANCH"

# Check for updates
log "Checking for updates..."
git fetch origin

# Check if there are updates
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/$CURRENT_BRANCH)

if [ "$LOCAL" = "$REMOTE" ]; then
    log "No updates available"
    exit 0
fi

log "Updates found. Local: $LOCAL, Remote: $REMOTE"

# Create backup before update
log "Creating backup..."
mkdir -p "$BACKUP_DIR"
./scripts/backup.sh backup

# Pull updates
log "Pulling updates..."
git pull origin $CURRENT_BRANCH

# Check if docker-compose files changed
if git diff --name-only HEAD~1 HEAD | grep -E "(docker-compose|Dockerfile)" > /dev/null; then
    log "Docker configuration changed, rebuilding images..."
    cd infra
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    cd ..
else
    log "No Docker changes, restarting services..."
    cd infra
    docker-compose restart
    cd ..
fi

# Wait for services to be healthy
log "Waiting for services to be healthy..."
sleep 30

# Check health
if curl -f http://localhost:4000/health > /dev/null 2>&1; then
    log "Update completed successfully"
    
    # Send notification (implement your notification method)
    # curl -X POST "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK" \
    #   -H 'Content-type: application/json' \
    #   --data '{"text":"VoxLink updated successfully to commit: '$REMOTE'"}'
    
else
    error "Services failed to start after update"
    
    # Rollback
    log "Rolling back to previous version..."
    git reset --hard HEAD~1
    cd infra
    docker-compose restart
    cd ..
    
    # Send error notification
    # curl -X POST "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK" \
    #   -H 'Content-type: application/json' \
    #   --data '{"text":"VoxLink update failed and rolled back"}'
    
    exit 1
fi

log "Auto-update completed successfully"
