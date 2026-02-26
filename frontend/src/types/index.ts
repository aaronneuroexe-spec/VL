// User types
export interface User {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  role: 'admin' | 'moderator' | 'member' | 'banned';
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen?: Date;
  preferences?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Channel types
export interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'stream';
  topic?: string;
  description?: string;
  isPrivate: boolean;
  permissions?: Record<string, any>;
  metadata?: Record<string, any>;
  memberCount: number;
  createdBy?: User;
  createdAt: Date;
  updatedAt: Date;
}

// Message types
export interface Message {
  id: string;
  channelId: string;
  authorId: string;
  content?: string;
  attachments?: Attachment[];
  metadata?: Record<string, any>;
  replyToId?: string;
  replyTo?: Message;
  editedAt?: Date;
  isDeleted: boolean;
  author: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'audio' | 'file';
  size: number;
}

// Event types
export interface Event {
  id: string;
  title: string;
  description?: string;
  startsAt: Date;
  endsAt?: Date;
  metadata?: Record<string, any>;
  isRecurring: boolean;
  channelId?: string;
  channel?: Channel;
  createdBy: User;
  createdAt: Date;
  updatedAt: Date;
}

// WebSocket types
export interface WebSocketMessage {
  type: string;
  data: any;
}

export interface PresenceUpdate {
  userId: string;
  username: string;
  status: 'online' | 'away' | 'busy' | 'offline';
}

export interface TypingIndicator {
  channelId: string;
  userId: string;
  username: string;
  isTyping: boolean;
}

// WebRTC types
export interface WebRTCConfig {
  rtcConfiguration: RTCConfiguration;
  turnServers: TURNServer[];
  stunServers: RTCIceServer[];
}

export interface TURNServer {
  urls: string[];
  username: string;
  credential: string;
}

export interface SignalingData {
  from: string;
  to: string;
  type: 'offer' | 'answer' | 'ice-candidate';
  data: any;
}

// Auth types
export interface LoginRequest {
  token: string;
  username?: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface CreateInviteRequest {
  channelId?: string;
  role?: string;
  expiresInHours?: number;
}

export interface CreateInviteResponse {
  inviteToken: string;
  expiresAt: Date;
  channelId?: string;
  role: string;
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Store types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ChannelState {
  channels: Channel[];
  currentChannel: Channel | null;
  isLoading: boolean;
}

export interface MessageState {
  messages: Record<string, Message[]>;
  isLoading: boolean;
  hasMore: Record<string, boolean>;
}

export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export interface WebRTCState {
  isConnected: boolean;
  isConnecting: boolean;
  localStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
  connections: Record<string, RTCPeerConnection>;
}

// Component props types
export interface ChannelListProps {
  channels: Channel[];
  currentChannel?: Channel | null;
  onChannelSelect: (channel: Channel) => void;
}

export interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

export interface VoicePanelProps {
  channel: Channel;
  isConnected: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  onMuteToggle: () => void;
  onDeafenToggle: () => void;
  onDisconnect: () => void;
}
