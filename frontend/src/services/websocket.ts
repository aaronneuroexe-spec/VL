import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth';
import { useChannelStore } from '@/store/channels';
import { useMessageStore } from '@/store/messages';
import { useWebSocketStore } from '@/store/websocket';
import { Message, PresenceUpdate, TypingIndicator, SignalingData } from '@/types';

// Note: This service uses store.getState() to access store outside React components

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(): void {
    const token = useAuthStore.getState().token;
    if (!token) {
      console.error('No auth token available for WebSocket connection');
      return;
    }

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:4000';
    
    this.socket = io(wsUrl, {
      auth: {
        token,
      },
      transports: ['websocket'],
      upgrade: true,
      rememberUpgrade: true,
    });

    this.setupEventListeners();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    useWebSocketStore.getState().setConnected(false);
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      useWebSocketStore.getState().setConnected(true);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      useWebSocketStore.getState().setConnected(false);
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('WebSocket connection error:', error);
      useWebSocketStore.getState().setError(error?.message || 'Connection error');
      this.handleReconnect();
    });

    // Channel events
    this.socket.on('channel_joined', (data) => {
      console.log('Channel joined:', data);
      useChannelStore.getState().updateChannel(data.channelId, {
        memberCount: data.members?.length || 0,
      });
    });

    this.socket.on('channel_left', (data) => {
      console.log('Channel left:', data);
    });

    // Message events
    this.socket.on('message', (message: Message) => {
      console.log('New message:', message);
      useMessageStore.getState().addMessage(message);
    });

    this.socket.on('channel_messages', (data) => {
      console.log('Channel messages:', data);
      useMessageStore.getState().setMessages(data.channelId, data.messages);
    });

    // Presence events
    this.socket.on('presence_update', (data: PresenceUpdate) => {
      console.log('Presence update:', data);
      // Update user presence in store
    });

    // Typing events
    this.socket.on('typing', (data: TypingIndicator) => {
      console.log('Typing indicator:', data);
      useMessageStore.getState().setTyping(data.channelId, data.userId, data.isTyping);
    });

    // WebRTC signaling events
    this.socket.on('signal', (data: SignalingData) => {
      console.log('WebRTC signal:', data);
      // Handle WebRTC signaling
    });

    this.socket.on('webrtc_offer', (data) => {
      console.log('WebRTC offer:', data);
      // Handle WebRTC offer
    });

    this.socket.on('webrtc_answer', (data) => {
      console.log('WebRTC answer:', data);
      // Handle WebRTC answer
    });

    this.socket.on('webrtc_ice', (data) => {
      console.log('WebRTC ICE candidate:', data);
      // Handle ICE candidate
    });

    // Error events
    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      useWebSocketStore.getState().setError(error.message);
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      useWebSocketStore.getState().setError('Connection failed after multiple attempts');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  // Channel methods
  joinChannel(channelId: string): void {
    if (this.socket) {
      this.socket.emit('join_channel', { channelId });
    }
  }

  leaveChannel(channelId: string): void {
    if (this.socket) {
      this.socket.emit('leave_channel', { channelId });
    }
  }

  // Message methods
  sendMessage(channelId: string, content: string, attachments?: any[], replyToId?: string): void {
    if (this.socket) {
      this.socket.emit('send_message', {
        channelId,
        content,
        attachments,
        replyToId,
      });
    }
  }

  setTyping(channelId: string, isTyping: boolean): void {
    if (this.socket) {
      this.socket.emit('typing', { channelId, isTyping });
    }
  }

  // WebRTC methods
  sendSignal(to: string, data: any): void {
    if (this.socket) {
      this.socket.emit('signal', { to, data });
    }
  }

  sendOffer(to: string, offer: RTCSessionDescriptionInit): void {
    if (this.socket) {
      this.socket.emit('webrtc_offer', { to, offer });
    }
  }

  sendAnswer(to: string, answer: RTCSessionDescriptionInit): void {
    if (this.socket) {
      this.socket.emit('webrtc_answer', { to, answer });
    }
  }

  sendIceCandidate(to: string, candidate: RTCIceCandidateInit): void {
    if (this.socket) {
      this.socket.emit('webrtc_ice', { to, candidate });
    }
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const wsService = new WebSocketService();
export default wsService;
