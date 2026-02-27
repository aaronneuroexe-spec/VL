// ─── User ──────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  role: 'admin' | 'moderator' | 'member' | 'banned';
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Guild ─────────────────────────────────────────────────────────────────

export interface Guild {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  banner?: string;
  inviteCode?: string;
  isPublic: boolean;
  requiresApproval: boolean;
  ownerId: string;
  owner?: User;
  members?: GuildMember[];
  roles?: GuildRole[];
  categories?: ChannelCategory[];
  createdAt: Date;
}

export interface GuildRole {
  id: string;
  name: string;
  color: string;
  permissions: number;
  position: number;
  isHoisted: boolean;
  isManaged: boolean;
  guildId: string;
}

export interface GuildMember {
  id: string;
  nickname?: string;
  status: 'active' | 'pending' | 'banned';
  isMuted: boolean;
  isDeafened: boolean;
  userId: string;
  guildId: string;
  joinedAt: Date;
  user: User;
  roles: GuildRole[];
}

export interface ChannelCategory {
  id: string;
  name: string;
  position: number;
  isPrivate: boolean;
  guildId: string;
  channels: Channel[];
}

// ─── Channel ───────────────────────────────────────────────────────────────

export interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'stream';
  topic?: string;
  description?: string;
  isPrivate: boolean;
  position: number;
  memberCount: number;
  guildId?: string;
  categoryId?: string;
  category?: ChannelCategory;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Message ───────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  channelId: string;
  authorId: string;
  content?: string;
  attachments?: Attachment[];
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

// ─── WebSocket ─────────────────────────────────────────────────────────────

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

// ─── Auth ──────────────────────────────────────────────────────────────────

export interface LoginRequest {
  username?: string;
  email?: string;
  inviteToken?: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface CreateInviteRequest {
  channelId?: string;
  role?: string;
  expiresInHours?: number;
  maxUses?: number;
}

export interface CreateInviteResponse {
  inviteToken: string;
  inviteUrl: string;
  expiresAt: Date;
  channelId?: string;
  role: string;
}

// ─── API ───────────────────────────────────────────────────────────────────

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

// ─── Store ─────────────────────────────────────────────────────────────────

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}
