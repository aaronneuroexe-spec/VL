#!/bin/bash

# VoxLink Database Backup Script
# Usage: ./backup.sh [options]

set -e

# Configuration
BACKUP_DIR="/backups/voxlink"
RETENTION_DAYS=30
LOG_FILE="/var/log/voxlink/backup.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Create backup directory
create_backup_dir() {
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$(dirname "$LOG_FILE")"
}

# Check if database is accessible
check_database() {
    log "Checking database connectivity..."
    
    if ! docker-compose exec -T db pg_isready -U voxlink -d voxlink > /dev/null 2>&1; then
        error "Database is not accessible"
    fi
    
    success "Database is accessible"
}

# Create database backup
create_backup() {
    local backup_file="$BACKUP_DIR/voxlink-$(date +%Y%m%d-%H%M%S).sql"
    local backup_file_gz="$backup_file.gz"
    
    log "Creating database backup: $backup_file"
    
    # Create SQL dump
    if docker-compose exec -T db pg_dump -U voxlink -d voxlink --verbose --clean --no-owner --no-privileges > "$backup_file"; then
        success "Database dump created"
    else
        error "Failed to create database dump"
    fi
    
    # Compress backup
    log "Compressing backup..."
    if gzip "$backup_file"; then
        success "Backup compressed: $backup_file_gz"
    else
        error "Failed to compress backup"
    fi
    
    # Calculate backup size
    local backup_size=$(du -h "$backup_file_gz" | cut -f1)
    log "Backup size: $backup_size"
    
    echo "$backup_file_gz"
}

# Create metadata file
create_metadata() {
    local backup_file="$1"
    local metadata_file="${backup_file}.meta"
    
    log "Creating metadata file: $metadata_file"
    
    cat > "$metadata_file" << EOF
{
  "backup_file": "$(basename "$backup_file")",
  "created_at": "$(date -Iseconds)",
  "database_version": "$(docker-compose exec -T db psql -U voxlink -d voxlink -t -c 'SELECT version();' | xargs)",
  "backup_size": "$(du -h "$backup_file" | cut -f1)",
  "hostname": "$(hostname)",
  "environment": "$(docker-compose exec -T db psql -U voxlink -d voxlink -t -c 'SELECT current_setting(\"server_version\");' | xargs)"
}
EOF
    
    success "Metadata file created"
}

# Verify backup integrity
verify_backup() {
    local backup_file="$1"
    
    log "Verifying backup integrity..."
    
    # Test if backup can be read
    if gunzip -t "$backup_file"; then
        success "Backup integrity verified"
    else
        error "Backup integrity check failed"
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."
    
    local deleted_count=0
    
    # Find and delete old backup files
    while IFS= read -r -d '' file; do
        log "Deleting old backup: $(basename "$file")"
        rm "$file"
        ((deleted_count++))
    done < <(find "$BACKUP_DIR" -name "voxlink-*.sql.gz" -type f -mtime +$RETENTION_DAYS -print0)
    
    # Find and delete old metadata files
    while IFS= read -r -d '' file; do
        log "Deleting old metadata: $(basename "$file")"
        rm "$file"
        ((deleted_count++))
    done < <(find "$BACKUP_DIR" -name "voxlink-*.sql.gz.meta" -type f -mtime +$RETENTION_DAYS -print0)
    
    if [[ $deleted_count -gt 0 ]]; then
        success "Deleted $deleted_count old backup files"
    else
        log "No old backups to delete"
    fi
}

# List available backups
list_backups() {
    log "Available backups:"
    
    if [[ ! -d "$BACKUP_DIR" ]] || [[ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]]; then
        warning "No backups found in $BACKUP_DIR"
        return
    fi
    
    echo ""
    printf "%-30s %-20s %-10s %-30s\n" "Filename" "Created" "Size" "Metadata"
    printf "%-30s %-20s %-10s %-30s\n" "--------" "-------" "----" "--------"
    
    for backup in "$BACKUP_DIR"/voxlink-*.sql.gz; do
        if [[ -f "$backup" ]]; then
            local filename=$(basename "$backup")
            local created=$(stat -c %y "$backup" | cut -d' ' -f1,2 | cut -d'.' -f1)
            local size=$(du -h "$backup" | cut -f1)
            local metadata=""
            
            if [[ -f "${backup}.meta" ]]; then
                metadata="✓"
            else
                metadata="✗"
            fi
            
            printf "%-30s %-20s %-10s %-30s\n" "$filename" "$created" "$size" "$metadata"
        fi
    done
}

# Restore backup
restore_backup() {
    local backup_file="$1"
    
    if [[ -z "$backup_file" ]]; then
        error "Backup file not specified"
    fi
    
    if [[ ! -f "$backup_file" ]]; then
        error "Backup file not found: $backup_file"
    fi
    
    log "Restoring backup: $backup_file"
    
    # Confirm restoration
    read -p "Are you sure you want to restore this backup? This will overwrite the current database. (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Restoration cancelled"
        return
    fi
    
    # Stop services that depend on database
    log "Stopping dependent services..."
    docker-compose stop backend
    
    # Restore database
    log "Restoring database..."
    if gunzip -c "$backup_file" | docker-compose exec -T db psql -U voxlink -d voxlink; then
        success "Database restored successfully"
    else
        error "Failed to restore database"
    fi
    
    # Start services
    log "Starting services..."
    docker-compose start backend
    
    success "Restoration completed"
}

# Main backup function
backup() {
    log "Starting VoxLink database backup"
    
    create_backup_dir
    check_database
    
    local backup_file=$(create_backup)
    create_metadata "$backup_file"
    verify_backup "$backup_file"
    cleanup_old_backups
    
    success "Backup completed successfully: $(basename "$backup_file")"
}

# Help function
show_help() {
    echo "VoxLink Database Backup Script"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  backup      - Create a new database backup (default)"
    echo "  list        - List available backups"
    echo "  restore     - Restore from a backup file"
    echo "  cleanup     - Clean up old backups"
    echo "  help        - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 backup"
    echo "  $0 list"
    echo "  $0 restore /backups/voxlink/voxlink-20240101-120000.sql.gz"
    echo "  $0 cleanup"
    echo ""
    echo "Environment variables:"
    echo "  BACKUP_DIR      - Backup directory (default: /backups/voxlink)"
    echo "  RETENTION_DAYS  - Days to keep backups (default: 30)"
}

# Main script logic
cd "$(dirname "$0")/../infra" || error "Failed to change to infra directory"

case "${1:-backup}" in
    "backup")
        backup
        ;;
    "list")
        create_backup_dir
        list_backups
        ;;
    "restore")
        restore_backup "$2"
        ;;
    "cleanup")
        create_backup_dir
        cleanup_old_backups
        ;;
    "help")
        show_help
        ;;
    *)
        error "Unknown command: $1. Use 'help' for usage information."
        ;;
esac
