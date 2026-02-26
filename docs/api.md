# VoxLink API Documentation

This document describes the REST API endpoints and WebSocket events for the VoxLink platform.

## Table of Contents

- [Authentication](#authentication)
- [REST API Endpoints](#rest-api-endpoints)
- [WebSocket Events](#websocket-events)
- [WebRTC Signaling](#webrtc-signaling)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

## Authentication

VoxLink uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Getting an Access Token

#### 1. Create Invite Token (Admin only)

```http
POST /api/auth/invite
Content-Type: application/json

{
  "channelId": "uuid", // optional
  "role": "member", // optional, default: member
  "expiresInHours": 24 // optional, default: 24
}
```

Response:
```json
{
  "inviteToken": "uuid",
  "expiresAt": "2024-01-01T12:00:00Z",
  "channelId": "uuid",
  "role": "member"
}
```

#### 2. Send Magic Link

```http
POST /api/auth/magic
Content-Type: application/json

{
  "email": "user@example.com"
}
```

Response:
```json
{
  "message": "Magic link sent successfully"
}
```

#### 3. Login with Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "token": "invite-token-or-magic-token",
  "username": "username" // optional for magic link
}
```

Response:
```json
{
  "access_token": "jwt-token",
  "user": {
    "id": "uuid",
    "username": "username",
    "email": "user@example.com",
    "role": "member",
    "avatar": "url",
    "status": "offline",
    "createdAt": "2024-01-01T12:00:00Z"
  }
}
```

## REST API Endpoints

### Users

#### Get Current User Profile

```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Get All Users

```http
GET /api/users
Authorization: Bearer <token>
```

#### Search Users

```http
GET /api/users/search?q=query
Authorization: Bearer <token>
```

#### Get User by ID

```http
GET /api/users/{id}
Authorization: Bearer <token>
```

#### Update User

```http
PATCH /api/users/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "new-username",
  "avatar": "new-avatar-url"
}
```

### Channels

#### Get All Channels

```http
GET /api/channels
Authorization: Bearer <token>
```

#### Search Channels

```http
GET /api/channels/search?q=query
Authorization: Bearer <token>
```

#### Get Channel by ID

```http
GET /api/channels/{id}
Authorization: Bearer <token>
```

#### Create Channel

```http
POST /api/channels
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "channel-name",
  "type": "text", // text, voice, stream
  "topic": "Channel description",
  "description": "Detailed description",
  "isPrivate": false
}
```

#### Update Channel

```http
PATCH /api/channels/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "new-name",
  "topic": "new-topic"
}
```

#### Delete Channel

```http
DELETE /api/channels/{id}
Authorization: Bearer <token>
```

### Messages

#### Get Channel Messages

```http
GET /api/channels/{channelId}/messages?limit=50&offset=0
Authorization: Bearer <token>
```

#### Send Message

```http
POST /api/channels/{channelId}/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Message content",
  "attachments": [], // optional
  "replyToId": "uuid" // optional
}
```

#### Search Messages

```http
GET /api/channels/{channelId}/messages/search?q=query
Authorization: Bearer <token>
```

#### Update Message

```http
PATCH /api/channels/{channelId}/messages/{messageId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Updated content"
}
```

#### Delete Message

```http
DELETE /api/channels/{channelId}/messages/{messageId}
Authorization: Bearer <token>
```

### Events

#### Get All Events

```http
GET /api/events?channelId=uuid
Authorization: Bearer <token>
```

#### Get Upcoming Events

```http
GET /api/events/upcoming?days=7
Authorization: Bearer <token>
```

#### Create Event

```http
POST /api/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Event title",
  "description": "Event description",
  "startsAt": "2024-01-01T12:00:00Z",
  "endsAt": "2024-01-01T14:00:00Z", // optional
  "channelId": "uuid", // optional
  "isRecurring": false
}
```

#### Update Event

```http
PATCH /api/events/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated title",
  "startsAt": "2024-01-01T13:00:00Z"
}
```

#### Delete Event

```http
DELETE /api/events/{id}
Authorization: Bearer <token>
```

### WebRTC Signaling

#### Get WebRTC Configuration

```http
GET /api/signaling/config
Authorization: Bearer <token>
```

Response:
```json
{
  "rtcConfiguration": {
    "iceServers": [
      {
        "urls": ["stun:stun.l.google.com:19302"]
      },
      {
        "urls": ["turn:yourdomain.com:3478"],
        "username": "turnuser",
        "credential": "turnpass"
      }
    ],
    "iceCandidatePoolSize": 10
  },
  "turnServers": [
    {
      "urls": ["turn:yourdomain.com:3478"],
      "username": "turnuser",
      "credential": "turnpass"
    }
  ],
  "stunServers": [
    {
      "urls": ["stun:stun.l.google.com:19302"]
    }
  ]
}
```

### Admin Endpoints

#### Get System Statistics

```http
GET /api/admin/stats
Authorization: Bearer <admin-token>
```

#### Ban User

```http
POST /api/admin/ban/{userId}
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "reason": "Violation of terms"
}
```

#### Delete Channel

```http
DELETE /api/admin/channels/{channelId}
Authorization: Bearer <admin-token>
```

### Monitoring

#### Health Check

```http
GET /health
```

Response:
```json
{
  "status": "healthy",
  "checks": {
    "database": {
      "status": "ok",
      "message": "Database connection successful"
    }
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

#### Metrics

```http
GET /metrics
```

Returns Prometheus-formatted metrics.

## WebSocket Events

Connect to WebSocket at: `ws://localhost:4000/ws`

### Authentication

Include token in connection:

```javascript
const socket = io('ws://localhost:4000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Client to Server Events

#### Join Channel

```javascript
socket.emit('join_channel', {
  channelId: 'uuid'
});
```

#### Leave Channel

```javascript
socket.emit('leave_channel', {
  channelId: 'uuid'
});
```

#### Send Message

```javascript
socket.emit('send_message', {
  channelId: 'uuid',
  content: 'Message content',
  attachments: [], // optional
  replyToId: 'uuid' // optional
});
```

#### Typing Indicator

```javascript
socket.emit('typing', {
  channelId: 'uuid',
  isTyping: true
});
```

#### WebRTC Signaling

```javascript
// Send offer
socket.emit('webrtc_offer', {
  to: 'user-id',
  offer: rtcSessionDescriptionInit
});

// Send answer
socket.emit('webrtc_answer', {
  to: 'user-id',
  answer: rtcSessionDescriptionInit
});

// Send ICE candidate
socket.emit('webrtc_ice', {
  to: 'user-id',
  candidate: rtcIceCandidateInit
});
```

### Server to Client Events

#### Channel Joined

```javascript
socket.on('channel_joined', (data) => {
  console.log('User joined:', data);
  // data: { channelId, user, members }
});
```

#### New Message

```javascript
socket.on('message', (message) => {
  console.log('New message:', message);
  // message: { id, channelId, content, author, createdAt, ... }
});
```

#### Channel Messages

```javascript
socket.on('channel_messages', (data) => {
  console.log('Channel messages:', data);
  // data: { channelId, messages: [...] }
});
```

#### Presence Update

```javascript
socket.on('presence_update', (data) => {
  console.log('User presence:', data);
  // data: { userId, username, status }
});
```

#### Typing Indicator

```javascript
socket.on('typing', (data) => {
  console.log('User typing:', data);
  // data: { channelId, userId, username, isTyping }
});
```

#### WebRTC Events

```javascript
// Receive offer
socket.on('webrtc_offer', (data) => {
  console.log('WebRTC offer:', data);
  // data: { from, offer }
});

// Receive answer
socket.on('webrtc_answer', (data) => {
  console.log('WebRTC answer:', data);
  // data: { from, answer }
});

// Receive ICE candidate
socket.on('webrtc_ice', (data) => {
  console.log('WebRTC ICE:', data);
  // data: { from, candidate }
});
```

#### Error Events

```javascript
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
  // error: { message, code }
});
```

## WebRTC Signaling

### Connection Flow

1. **Get Configuration**: Call `/api/signaling/config` to get TURN/STUN servers
2. **Create PeerConnection**: Use the configuration to create RTCPeerConnection
3. **Exchange Offers/Answers**: Use WebSocket events to exchange SDP
4. **Exchange ICE Candidates**: Exchange ICE candidates for NAT traversal

### Example Implementation

```javascript
// Get WebRTC configuration
const config = await fetch('/api/signaling/config').then(r => r.json());

// Create peer connection
const pc = new RTCPeerConnection(config.rtcConfiguration);

// Handle incoming offer
socket.on('webrtc_offer', async (data) => {
  await pc.setRemoteDescription(data.offer);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  
  socket.emit('webrtc_answer', {
    to: data.from,
    answer: answer
  });
});

// Handle incoming answer
socket.on('webrtc_answer', async (data) => {
  await pc.setRemoteDescription(data.answer);
});

// Handle ICE candidates
socket.on('webrtc_ice', async (data) => {
  await pc.addIceCandidate(data.candidate);
});

// Send ICE candidates
pc.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit('webrtc_ice', {
      to: targetUserId,
      candidate: event.candidate
    });
  }
};
```

## Error Handling

### HTTP Error Responses

All API endpoints return consistent error responses:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2024-01-01T12:00:00Z",
  "path": "/api/channels"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `500` - Internal Server Error

### WebSocket Error Events

```javascript
socket.on('error', (error) => {
  switch (error.code) {
    case 'AUTH_FAILED':
      // Handle authentication failure
      break;
    case 'CHANNEL_NOT_FOUND':
      // Handle channel not found
      break;
    case 'PERMISSION_DENIED':
      // Handle permission denied
      break;
    default:
      // Handle generic error
      console.error('Unknown error:', error);
  }
});
```

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **General endpoints**: 100 requests per minute
- **Authentication endpoints**: 10 requests per minute
- **Message endpoints**: 30 requests per minute

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640995200
```

When rate limit is exceeded:

```json
{
  "statusCode": 429,
  "message": "Too Many Requests",
  "retryAfter": 60
}
```
