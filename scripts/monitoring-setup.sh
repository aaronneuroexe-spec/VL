#!/bin/bash

# VoxLink Monitoring Setup Script
# Sets up Prometheus + Grafana monitoring

set -e

echo "📊 Setting up VoxLink monitoring..."

# Create monitoring directory
mkdir -p monitoring/{prometheus,grafana}

# Prometheus configuration
cat > monitoring/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'voxlink-backend'
    static_configs:
      - targets: ['backend:4000']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'voxlink-db'
    static_configs:
      - targets: ['db:5432']

  - job_name: 'voxlink-redis'
    static_configs:
      - targets: ['redis:6379']
EOF

# Grafana configuration
cat > monitoring/grafana/grafana.ini << 'EOF'
[server]
http_port = 3001
root_url = http://localhost:3001/

[security]
admin_user = admin
admin_password = voxlink123

[users]
allow_sign_up = false
allow_org_create = false
EOF

# Docker Compose for monitoring
cat > monitoring/docker-compose.monitoring.yml << 'EOF'
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: voxlink-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus:/etc/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'

  grafana:
    image: grafana/grafana:latest
    container_name: voxlink-grafana
    ports:
      - "3001:3001"
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/grafana.ini:/etc/grafana/grafana.ini
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=voxlink123

volumes:
  grafana-data:
EOF

# VoxLink dashboard for Grafana
cat > monitoring/voxlink-dashboard.json << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "VoxLink Monitoring",
    "tags": ["voxlink"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Active Users",
        "type": "stat",
        "targets": [
          {
            "expr": "voxlink_online_users",
            "legendFormat": "Online Users"
          }
        ]
      },
      {
        "id": 2,
        "title": "WebSocket Connections",
        "type": "graph",
        "targets": [
          {
            "expr": "voxlink_websocket_connections",
            "legendFormat": "Active Connections"
          }
        ]
      },
      {
        "id": 3,
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, http_request_duration_seconds_bucket)",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "id": 4,
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "5xx errors/sec"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
EOF

echo "✅ Monitoring configuration created!"
echo ""
echo "🚀 To start monitoring:"
echo "   cd monitoring"
echo "   docker-compose -f docker-compose.monitoring.yml up -d"
echo ""
echo "🌐 Access URLs:"
echo "   Grafana: http://localhost:3001 (admin/voxlink123)"
echo "   Prometheus: http://localhost:9090"
echo ""
echo "📊 Import the dashboard from voxlink-dashboard.json in Grafana"
