#!/bin/bash

# VoxLink Deployment Script
# Usage: ./deploy.sh [environment] [options]

set -e

# Configuration
ENVIRONMENT=${1:-production}
BACKUP_DIR="/backups/voxlink"
LOG_FILE="/var/log/voxlink/deploy.log"

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

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root"
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
    fi
    
    if ! command -v git &> /dev/null; then
        error "Git is not installed"
    fi
    
    success "Prerequisites check passed"
}

# Backup database
backup_database() {
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log "Creating database backup..."
        
        BACKUP_FILE="$BACKUP_DIR/voxlink-$(date +%Y%m%d-%H%M%S).sql"
        mkdir -p "$BACKUP_DIR"
        
        if docker-compose exec -T db pg_dump -U voxlink voxlink > "$BACKUP_FILE"; then
            success "Database backup created: $BACKUP_FILE"
        else
            error "Failed to create database backup"
        fi
    fi
}

# Pull latest images
pull_images() {
    log "Pulling latest Docker images..."
    
    if docker-compose pull; then
        success "Images pulled successfully"
    else
        error "Failed to pull images"
    fi
}

# Stop services
stop_services() {
    log "Stopping services..."
    
    if docker-compose down; then
        success "Services stopped"
    else
        warning "Some services may not have stopped cleanly"
    fi
}

# Start services
start_services() {
    log "Starting services..."
    
    if docker-compose up -d; then
        success "Services started"
    else
        error "Failed to start services"
    fi
}

# Wait for services to be healthy
wait_for_services() {
    log "Waiting for services to be healthy..."
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if docker-compose ps | grep -q "healthy\|Up"; then
            success "Services are healthy"
            return 0
        fi
        
        log "Attempt $attempt/$max_attempts - waiting for services..."
        sleep 10
        ((attempt++))
    done
    
    error "Services failed to become healthy within expected time"
}

# Run migrations
run_migrations() {
    log "Running database migrations..."
    
    if docker-compose exec backend npm run migration:run; then
        success "Migrations completed"
    else
        error "Migration failed"
    fi
}

# Update SSL certificates (if using Let's Encrypt)
update_ssl() {
    if [[ "$ENVIRONMENT" == "production" ]] && command -v certbot &> /dev/null; then
        log "Updating SSL certificates..."
        
        if certbot renew --quiet; then
            success "SSL certificates updated"
            
            # Reload nginx to use new certificates
            docker-compose exec nginx nginx -s reload
        else
            warning "SSL certificate renewal failed"
        fi
    fi
}

# Cleanup old backups
cleanup_backups() {
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log "Cleaning up old backups..."
        
        # Keep only last 7 days of backups
        find "$BACKUP_DIR" -name "voxlink-*.sql" -mtime +7 -delete
        
        success "Old backups cleaned up"
    fi
}

# Show deployment status
show_status() {
    log "Deployment status:"
    docker-compose ps
    
    echo ""
    log "Service URLs:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend API: http://localhost:4000"
    echo "  API Docs: http://localhost:4000/api/docs"
    echo "  Health Check: http://localhost:4000/health"
}

# Main deployment function
deploy() {
    log "Starting VoxLink deployment for environment: $ENVIRONMENT"
    
    check_root
    check_prerequisites
    
    # Change to infra directory
    cd "$(dirname "$0")/../infra" || error "Failed to change to infra directory"
    
    backup_database
    pull_images
    stop_services
    start_services
    wait_for_services
    run_migrations
    update_ssl
    cleanup_backups
    
    success "Deployment completed successfully!"
    show_status
}

# Rollback function
rollback() {
    log "Starting rollback..."
    
    cd "$(dirname "$0")/../infra" || error "Failed to change to infra directory"
    
    # Stop current services
    stop_services
    
    # Find latest backup
    LATEST_BACKUP=$(find "$BACKUP_DIR" -name "voxlink-*.sql" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
    
    if [[ -z "$LATEST_BACKUP" ]]; then
        error "No backup found for rollback"
    fi
    
    log "Rolling back to backup: $LATEST_BACKUP"
    
    # Start services
    start_services
    wait_for_services
    
    # Restore database
    if docker-compose exec -T db psql -U voxlink -d voxlink < "$LATEST_BACKUP"; then
        success "Database restored from backup"
    else
        error "Failed to restore database"
    fi
    
    success "Rollback completed successfully!"
}

# Help function
show_help() {
    echo "VoxLink Deployment Script"
    echo ""
    echo "Usage: $0 [environment] [command]"
    echo ""
    echo "Environments:"
    echo "  production  - Deploy to production (default)"
    echo "  staging     - Deploy to staging"
    echo ""
    echo "Commands:"
    echo "  deploy      - Deploy the application (default)"
    echo "  rollback    - Rollback to previous version"
    echo "  status      - Show deployment status"
    echo "  help        - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 production deploy"
    echo "  $0 staging"
    echo "  $0 rollback"
    echo "  $0 status"
}

# Main script logic
case "${2:-deploy}" in
    "deploy")
        deploy
        ;;
    "rollback")
        rollback
        ;;
    "status")
        cd "$(dirname "$0")/../infra" || error "Failed to change to infra directory"
        show_status
        ;;
    "help")
        show_help
        ;;
    *)
        error "Unknown command: $2. Use 'help' for usage information."
        ;;
esac
