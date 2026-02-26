#!/bin/bash

# VoxLink Quick Test Script
# Быстрая проверка всех основных компонентов

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0

test_pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((PASSED++))
}

test_fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((FAILED++))
}

test_info() {
    echo -e "${BLUE}ℹ️  INFO${NC}: $1"
}

echo "🧪 VoxLink Quick Test"
echo "====================="
echo ""

# Test 1: Check if services are running
test_info "Checking if services are running..."
if docker-compose ps | grep -q "Up"; then
    test_pass "Services are running"
else
    test_fail "Services are not running. Run: docker-compose up -d"
    exit 1
fi

# Test 2: Health check
test_info "Testing health endpoint..."
if curl -f -s http://localhost:4000/health > /dev/null; then
    test_pass "Health endpoint is accessible"
else
    test_fail "Health endpoint is not accessible"
fi

# Test 3: Frontend accessibility
test_info "Testing frontend..."
if curl -f -s http://localhost:3000 > /dev/null; then
    test_pass "Frontend is accessible"
else
    test_fail "Frontend is not accessible"
fi

# Test 4: API documentation
test_info "Testing API documentation..."
if curl -f -s http://localhost:4000/api/docs > /dev/null; then
    test_pass "API documentation is accessible"
else
    test_fail "API documentation is not accessible"
fi

# Test 5: Database connectivity
test_info "Testing database connectivity..."
if docker-compose exec -T db pg_isready -U voxlink > /dev/null 2>&1; then
    test_pass "Database is accessible"
else
    test_fail "Database is not accessible"
fi

# Test 6: Redis connectivity
test_info "Testing Redis connectivity..."
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    test_pass "Redis is accessible"
else
    test_fail "Redis is not accessible"
fi

# Test 7: WebSocket port
test_info "Testing WebSocket port..."
if timeout 2 bash -c 'echo > /dev/tcp/localhost/4000' 2>/dev/null; then
    test_pass "WebSocket port is open"
else
    test_fail "WebSocket port is not accessible"
fi

# Test 8: API endpoints
test_info "Testing API endpoints..."

# Test auth endpoint
if curl -f -s -X POST http://localhost:4000/api/auth/invite \
    -H "Content-Type: application/json" \
    -d '{"role": "member"}' > /dev/null 2>&1; then
    test_pass "Auth API is working"
else
    test_fail "Auth API is not working"
fi

# Test 9: Metrics endpoint
test_info "Testing metrics endpoint..."
if curl -f -s http://localhost:4000/metrics > /dev/null; then
    test_pass "Metrics endpoint is accessible"
else
    test_fail "Metrics endpoint is not accessible"
fi

# Test 10: Check logs for errors
test_info "Checking for errors in logs..."
ERROR_COUNT=$(docker-compose logs --tail=100 | grep -i "error" | wc -l)
if [ "$ERROR_COUNT" -eq 0 ]; then
    test_pass "No errors in recent logs"
else
    test_info "Found $ERROR_COUNT error(s) in logs (may be expected)"
fi

# Test 11: Check disk space
test_info "Checking disk space..."
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 90 ]; then
    test_pass "Sufficient disk space available ($DISK_USAGE% used)"
else
    test_fail "Low disk space ($DISK_USAGE% used)"
fi

# Test 12: Check memory usage
test_info "Checking memory usage..."
MEM_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
if [ "$MEM_USAGE" -lt 90 ]; then
    test_pass "Sufficient memory available ($MEM_USAGE% used)"
else
    test_info "High memory usage ($MEM_USAGE% used) - monitor closely"
fi

# Summary
echo ""
echo "====================="
echo "Test Summary"
echo "====================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Check the output above.${NC}"
    exit 1
fi