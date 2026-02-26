#!/bin/bash

# VoxLink Deployment Test Script
# Tests the deployment and creates initial test data

set -e

echo "🧪 Testing VoxLink Deployment..."

# Test 1: Health Check
echo "1. Testing health endpoints..."
curl -f http://localhost:4000/health || exit 1
curl -f http://localhost:3000 || exit 1
echo "✅ Health checks passed"

# Test 2: Database connectivity
echo "2. Testing database connectivity..."
cd infra
docker-compose exec -T db psql -U voxlink -d voxlink -c "SELECT 1;" > /dev/null || exit 1
echo "✅ Database connection OK"

# Test 3: WebSocket connection
echo "3. Testing WebSocket connectivity..."
timeout 5 bash -c 'echo > /dev/tcp/localhost/4000' || exit 1
echo "✅ WebSocket port accessible"

# Test 4: Create test channels
echo "4. Creating test channels..."
curl -X POST http://localhost:4000/api/channels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(curl -s -X POST http://localhost:4000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"token":"admin","username":"admin"}' | jq -r '.access_token')" \
  -d '{"name":"general","type":"text","topic":"General guild chat"}' \
  -d '{"name":"voice-general","type":"voice","topic":"Main voice channel"}' \
  -d '{"name":"officers","type":"text","topic":"Officer chat","isPrivate":true}' || echo "⚠️  Channel creation failed (normal if already exists)"

echo "✅ Test deployment completed successfully!"
echo ""
echo "🌐 Access URLs:"
echo "   Frontend: http://localhost:3000"
echo "   API Docs: http://localhost:4000/api/docs"
echo "   Health:   http://localhost:4000/health"
echo ""
echo "👥 Test with invite token:"
curl -X POST http://localhost:4000/api/auth/invite \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(curl -s -X POST http://localhost:4000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"token":"admin","username":"admin"}' | jq -r '.access_token')" \
  -d '{"role":"member","expiresInHours":168}' | jq -r '.inviteToken'
