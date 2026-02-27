import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth';
import { useChannelStore } from '@/store/channels';
import { useMessageStore } from '@/store/messages';
import { useWebSocketStore } from '@/store/websocket';
import { Message, PresenceUpdate, TypingIndicator } from '@/types';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(): void {
    const token = useAuthStore.getState().token;
    if (!token) return;

    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:4000';

    this.socket = io(wsUrl, {
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    useWebSocketStore.getState().setConnected(false);
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      useWebSocketStore.getState().setConnected(true);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      useWebSocketStore.getState().setConnected(false);
    });

    this.socket.on('connect_error', (error: any) => {
      useWebSocketStore.getState().setError(error?.message || 'Connection error');
    });

    // ─── Каналы ────────────────────────────────────────────────────────────
    // Новые имена событий совпадают с бэкендом после рефакторинга

    this.socket.on('channel:ready', (data: { channelId: string; messages: Message[]; members: any[] }) => {
      useMessageStore.getState().setMessages(data.channelId, data.messages);
      useChannelStore.getState().updateChannel(data.channelId, {
        memberCount: data.members?.length || 0,
      });
    });

    this.socket.on('channel:member_joined', (data: { channelId: string; user: any }) => {
      useChannelStore.getState().updateChannel(data.channelId, {
        memberCount: (useChannelStore.getState().channels.find(c => c.id === data.channelId)?.memberCount ?? 0) + 1,
      });
    });

    this.socket.on('channel:member_left', (data: { channelId: string; userId: string }) => {
      const current = useChannelStore.getState().channels.find(c => c.id === data.channelId)?.memberCount ?? 1;
      useChannelStore.getState().updateChannel(data.channelId, {
        memberCount: Math.max(0, current - 1),
      });
    });

    // ─── Сообщения ─────────────────────────────────────────────────────────

    this.socket.on('message:new', (message: Message) => {
      useMessageStore.getState().addMessage(message);
    });

    // ─── Presence ──────────────────────────────────────────────────────────

    this.socket.on('presence', (data: PresenceUpdate) => {
      // TODO: обновить статус пользователя в store
    });

    // ─── Typing ────────────────────────────────────────────────────────────

    this.socket.on('typing', (data: TypingIndicator) => {
      useMessageStore.getState().setTyping(data.channelId, data.userId, data.isTyping);
    });

    // ─── Ошибки ────────────────────────────────────────────────────────────

    this.socket.on('error', (error: { message: string }) => {
      useWebSocketStore.getState().setError(error.message);
    });
  }

  // ─── Публичные методы ─────────────────────────────────────────────────────

  joinChannel(channelId: string): void {
    this.socket?.emit('channel:join', { channelId });
  }

  leaveChannel(channelId: string): void {
    this.socket?.emit('channel:leave', { channelId });
  }

  sendMessage(channelId: string, content: string, attachments?: any[], replyToId?: string): void {
    this.socket?.emit('message:send', { channelId, content, attachments, replyToId });
  }

  setTyping(channelId: string, isTyping: boolean): void {
    this.socket?.emit(isTyping ? 'typing:start' : 'typing:stop', { channelId });
  }

  // Guild presence
  joinGuild(guildId: string): void {
    this.socket?.emit('guild:join', { guildId });
  }

  leaveGuild(guildId: string): void {
    this.socket?.emit('guild:leave', { guildId });
  }

  // Voice presence — само аудио идёт через LiveKit, только уведомляем кто в канале
  notifyVoiceJoined(channelId: string): void {
    this.socket?.emit('voice:joined', { channelId });
  }

  notifyVoiceLeft(channelId: string): void {
    this.socket?.emit('voice:left', { channelId });
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const wsService = new WebSocketService();
export default wsService;


