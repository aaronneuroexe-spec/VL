# VoxLink Deployment Guide

This guide covers the complete deployment process for VoxLink, from local development to production.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Production Deployment](#production-deployment)
- [TURN Server Setup](#turn-server-setup)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Monitoring](#monitoring)
- [Backup and Recovery](#backup-and-recovery)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **OS**: Ubuntu 20.04+ or CentOS 8+
- **RAM**: Minimum 4GB, Recommended 8GB+
- **CPU**: 2+ cores
- **Storage**: 20GB+ free space
- **Network**: Public IP address for TURN server

### Software Requirements

- Docker 20.10+
- Docker Compose 2.0+
- Git
- Node.js 20+ (for development)

## Local Development

### 1. Clone Repository

```bash
git clone <repository-url>
cd voxlink
```

### 2. Environment Setup

```bash
# Copy environment template
# Linux/Mac:
cp env.example .env

# Windows:
copy env.example .env

# Edit environment variables
# Linux/Mac:
nano .env

# Windows:
notepad .env
```

### 3. Start Services

```bash
cd infra
docker-compose up --build
```

### 4. Access Applications

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **API Documentation**: http://localhost:4000/api/docs
- **Health Check**: http://localhost:4000/health

## Production Deployment

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo apt install git -y
```

### 2. Clone and Configure

```bash
# Clone repository
git clone <repository-url>
cd voxlink

# Copy and configure environment
cp env.example .env
nano .env
```

### 3. Configure Production Environment

Edit `.env` with production values:

```bash
# App Configuration
NODE_ENV=production
PORT=4000
APP_HOST=0.0.0.0
FRONTEND_URL=https://yourdomain.com

# Database
DATABASE_URL=postgres://voxlink:strong_password@db:5432/voxlink
REDIS_URL=redis://redis:6379

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXP=7d

# TURN/STUN Server
TURN_HOST=yourdomain.com
TURN_PORT=3478
TURN_USER=turnuser
TURN_PASS=strong_turn_password
TURN_SECRET=your_turn_secret

# SMTP
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_USER=smtp_user
SMTP_PASS=smtp_password
SMTP_FROM=noreply@yourdomain.com
```

### 4. Deploy with Script

```bash
# Make scripts executable
chmod +x scripts/deploy.sh
chmod +x scripts/backup.sh

# Deploy to production
./scripts/deploy.sh production
```

### 5. Manual Deployment

```bash
cd infra

# Create necessary directories
sudo mkdir -p /backups/voxlink
sudo mkdir -p /var/log/voxlink
sudo chown -R $USER:$USER /backups/voxlink
sudo chown -R $USER:$USER /var/log/voxlink

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

## TURN Server Setup

### 1. Install coturn

```bash
sudo apt update
sudo apt install coturn -y
```

### 2. Configure coturn

Edit `/etc/coturn/turnserver.conf`:

```bash
# Copy our configuration
sudo cp infra/coturn/turnserver.conf /etc/coturn/turnserver.conf

# Edit configuration
sudo nano /etc/coturn/turnserver.conf
```

Update the following values:
- `external-ip=<YOUR_SERVER_PUBLIC_IP>`
- `static-auth-secret=<YOUR_STATIC_SECRET>`

### 3. Firewall Configuration

```bash
# Allow TURN/STUN ports
sudo ufw allow 3478/udp
sudo ufw allow 3478/tcp
sudo ufw allow 5349/tcp
sudo ufw allow 5349/udp
sudo ufw allow 49152:65535/udp
```

### 4. Start coturn

```bash
sudo systemctl enable coturn
sudo systemctl start coturn
sudo systemctl status coturn
```

## SSL/TLS Configuration

### 1. Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Obtain SSL Certificate

```bash
sudo certbot --nginx -d yourdomain.com
```

### 3. Auto-renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Add to crontab
sudo crontab -e

# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

### 4. Update Nginx Configuration

Edit `infra/nginx/nginx.conf` to enable HTTPS:

```nginx
# Uncomment HTTPS server block
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;
    
    # ... rest of configuration
}
```

## Monitoring

### 1. Health Checks

```bash
# Check application health
curl http://localhost:4000/health

# Check metrics
curl http://localhost:4000/metrics
```

### 2. Log Monitoring

```bash
# View application logs
docker-compose logs -f backend
docker-compose logs -f frontend

# View system logs
journalctl -u docker -f
```

### 3. Resource Monitoring

```bash
# Check resource usage
docker stats

# Check disk usage
df -h
docker system df
```

## Backup and Recovery

### 1. Automated Backups

```bash
# Create backup
./scripts/backup.sh backup

# List backups
./scripts/backup.sh list

# Setup cron for automated backups
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/voxlink/scripts/backup.sh backup
```

### 2. Manual Backup

```bash
# Database backup
docker-compose exec db pg_dump -U voxlink voxlink > backup.sql

# Volume backup
docker run --rm -v voxlink_db-data:/data -v $(pwd):/backup ubuntu tar czf /backup/db-backup.tar.gz /data
```

### 3. Recovery

```bash
# Restore from backup
./scripts/backup.sh restore /backups/voxlink/voxlink-20240101-120000.sql.gz
```

## Troubleshooting

### Common Issues

#### 1. WebSocket Connection Failed

```bash
# Check if ports are open
sudo ufw status
sudo netstat -tlnp | grep :4000
```

#### 2. Database Connection Issues

```bash
# Check database logs
docker-compose logs db

# Test database connection
docker-compose exec db psql -U voxlink -d voxlink -c "SELECT 1;"
```

#### 3. TURN Server Not Working

```bash
# Check coturn status
sudo systemctl status coturn

# Test TURN server
turnutils_stunclient yourdomain.com
```

#### 4. High Memory Usage

```bash
# Check memory usage
docker stats

# Restart services
docker-compose restart
```

### Performance Optimization

#### 1. Database Optimization

```sql
-- Add indexes for better performance
CREATE INDEX CONCURRENTLY idx_messages_channel_created ON messages(channel_id, created_at);
CREATE INDEX CONCURRENTLY idx_users_status ON users(status);
```

#### 2. Redis Configuration

```bash
# Edit Redis configuration for better performance
docker-compose exec redis redis-cli CONFIG SET maxmemory 512mb
docker-compose exec redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

#### 3. Nginx Optimization

```nginx
# Add to nginx.conf
worker_processes auto;
worker_connections 1024;

# Enable gzip
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
```

### Support and Maintenance

#### 1. Regular Maintenance Tasks

```bash
# Weekly maintenance script
#!/bin/bash
docker-compose pull
docker-compose up -d
docker system prune -f
./scripts/backup.sh backup
```

#### 2. Security Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose pull
docker-compose up -d
```

#### 3. Monitoring Setup

Consider setting up monitoring with:
- **Prometheus** for metrics collection
- **Grafana** for visualization
- **AlertManager** for notifications
- **ELK Stack** for log aggregation

## Support

For additional support:

1. Check the [FAQ](./faq.md)
2. Review [API Documentation](./api.md)
3. Check [GitHub Issues](https://github.com/your-org/voxlink/issues)
4. Contact the development team

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.
