#!/bin/bash

# VoxLink Load Testing Script
# Simulates multiple users connecting and using voice channels

set -e

USERS=${1:-10}
CHANNEL_ID=${2:-"voice-general"}
DURATION=${3:-300} # 5 minutes

echo "🧪 Starting load test with $USERS users for $DURATION seconds..."

# Install dependencies if needed
if ! command -v k6 &> /dev/null; then
    echo "Installing k6..."
    sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
    echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
    sudo apt-get update
    sudo apt-get install k6
fi

# Create k6 test script
cat > load-test.js << 'EOF'
import http from 'k6/http';
import { check } from 'k6';
import ws from 'k6/ws';
import { Rate } from 'k6/metrics';

export const errorRate = new Rate('errors');

export let options = {
  stages: [
    { duration: '30s', target: __ENV.USERS },
    { duration: __ENV.DURATION + 's', target: __ENV.USERS },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    errors: ['rate<0.1'],
    http_req_duration: ['p(95)<1000'],
  },
};

export default function () {
  const userId = `testuser_${__VU}`;
  const baseUrl = __ENV.BASE_URL || 'http://localhost:4000';
  
  // Step 1: Login
  const loginRes = http.post(`${baseUrl}/api/auth/login`, JSON.stringify({
    token: __ENV.INVITE_TOKEN || 'admin',
    username: userId
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const loginSuccess = check(loginRes, {
    'login successful': (r) => r.status === 200,
    'received token': (r) => r.json('access_token') !== undefined,
  });
  
  if (!loginSuccess) {
    errorRate.add(1);
    return;
  }
  
  const token = loginRes.json('access_token');
  
  // Step 2: Get channels
  const channelsRes = http.get(`${baseUrl}/api/channels`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  check(channelsRes, {
    'channels retrieved': (r) => r.status === 200,
  });
  
  // Step 3: WebSocket connection and voice simulation
  const wsUrl = baseUrl.replace('http', 'ws');
  const socket = ws.connect(`${wsUrl}/ws`, {
    headers: { 'Authorization': `Bearer ${token}` },
  }, function (socket) {
    socket.on('open', () => {
      // Join voice channel
      socket.send(JSON.stringify({
        type: 'join_channel',
        data: { channelId: __ENV.CHANNEL_ID || 'voice-general' }
      }));
      
      // Simulate voice activity
      const interval = setInterval(() => {
        if (Math.random() > 0.7) {
          socket.send(JSON.stringify({
            type: 'webrtc_offer',
            data: { 
              to: `user_${Math.floor(Math.random() * __ENV.USERS)}`,
              offer: { type: 'offer', sdp: 'fake-sdp' }
            }
          }));
        }
      }, 5000);
      
      // Cleanup after test duration
      setTimeout(() => {
        clearInterval(interval);
        socket.close();
      }, parseInt(__ENV.DURATION) * 1000);
    });
    
    socket.on('error', (e) => {
      console.log('WebSocket error:', e);
      errorRate.add(1);
    });
  });
  
  // Step 4: Send some messages
  for (let i = 0; i < 3; i++) {
    const messageRes = http.post(`${baseUrl}/api/channels/${__ENV.CHANNEL_ID}/messages`, JSON.stringify({
      content: `Test message ${i} from ${userId}`
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
    });
    
    check(messageRes, {
      'message sent': (r) => r.status === 201,
    });
    
    // Wait between messages
    sleep(Math.random() * 10 + 5);
  }
}

export function teardown(data) {
  console.log('Load test completed');
}
EOF

# Run the load test
USERS=$USERS DURATION=$DURATION CHANNEL_ID=$CHANNEL_ID k6 run load-test.js

# Cleanup
rm load-test.js

echo "✅ Load test completed!"
echo "📊 Check the results above for performance metrics"
