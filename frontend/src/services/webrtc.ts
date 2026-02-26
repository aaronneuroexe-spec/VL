import { WebRTCConfig, TURNServer } from '@/types';
import { wsService } from './websocket';

class WebRTCService {
  private connections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private remoteStreams: Map<string, MediaStream> = new Map();
  private config: WebRTCConfig | null = null;

  async initialize(): Promise<WebRTCConfig> {
    try {
      // Get WebRTC configuration from backend
      const response = await fetch('/api/signaling/config');
      this.config = await response.json();
      return this.config;
    } catch (error) {
      console.error('Failed to get WebRTC config:', error);
      throw error;
    }
  }

  async getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      return this.localStream;
    } catch (error) {
      console.error('Failed to get user media:', error);
      throw error;
    }
  }

  async createPeerConnection(userId: string): Promise<RTCPeerConnection> {
    if (!this.config) {
      await this.initialize();
    }

    const config: RTCConfiguration = {
      iceServers: [
        ...this.config!.stunServers,
        ...this.config!.turnServers.map(turn => ({
          urls: turn.urls,
          username: turn.username,
          credential: turn.credential,
        })),
      ],
      iceCandidatePoolSize: 10,
    };

    const connection = new RTCPeerConnection(config);

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        connection.addTrack(track, this.localStream!);
      });
    }

    // Handle remote stream
    connection.ontrack = (event) => {
      console.log('Remote track received:', event);
      const [remoteStream] = event.streams;
      this.remoteStreams.set(userId, remoteStream);
      
      // Emit event for UI to handle
      window.dispatchEvent(new CustomEvent('remoteStream', {
        detail: { userId, stream: remoteStream }
      }));
    };

    // Handle ICE candidates
    connection.onicecandidate = (event) => {
      if (event.candidate) {
        wsService.sendIceCandidate(userId, event.candidate);
      }
    };

    // Handle connection state changes
    connection.onconnectionstatechange = () => {
      console.log('Connection state changed:', connection.connectionState);
      
      if (connection.connectionState === 'connected') {
        window.dispatchEvent(new CustomEvent('peerConnected', {
          detail: { userId }
        }));
      } else if (connection.connectionState === 'disconnected' || 
                 connection.connectionState === 'failed') {
        this.cleanup(userId);
      }
    };

    this.connections.set(userId, connection);
    return connection;
  }

  async createOffer(userId: string): Promise<RTCSessionDescriptionInit> {
    const connection = this.connections.get(userId);
    if (!connection) {
      throw new Error('No peer connection found');
    }

    const offer = await connection.createOffer();
    await connection.setLocalDescription(offer);
    
    wsService.sendOffer(userId, offer);
    return offer;
  }

  async handleOffer(userId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    let connection = this.connections.get(userId);
    
    if (!connection) {
      connection = await this.createPeerConnection(userId);
    }

    await connection.setRemoteDescription(offer);
    const answer = await connection.createAnswer();
    await connection.setLocalDescription(answer);
    
    wsService.sendAnswer(userId, answer);
  }

  async handleAnswer(userId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const connection = this.connections.get(userId);
    if (!connection) {
      throw new Error('No peer connection found');
    }

    await connection.setRemoteDescription(answer);
  }

  async handleIceCandidate(userId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const connection = this.connections.get(userId);
    if (!connection) {
      throw new Error('No peer connection found');
    }

    await connection.addIceCandidate(candidate);
  }

  async joinChannel(channelId: string): Promise<void> {
    // Implementation for joining a channel
    // This would involve signaling with other users in the channel
    console.log('Joining channel:', channelId);
  }

  async leaveChannel(channelId: string): Promise<void> {
    // Implementation for leaving a channel
    // Clean up all peer connections for this channel
    console.log('Leaving channel:', channelId);
  }

  muteAudio(): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = false;
      });
    }
  }

  unmuteAudio(): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = true;
      });
    }
  }

  muteVideo(): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = false;
      });
    }
  }

  unmuteVideo(): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = true;
      });
    }
  }

  isAudioMuted(): boolean {
    if (!this.localStream) return true;
    return this.localStream.getAudioTracks().some(track => !track.enabled);
  }

  isVideoMuted(): boolean {
    if (!this.localStream) return true;
    return this.localStream.getVideoTracks().some(track => !track.enabled);
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(userId: string): MediaStream | null {
    return this.remoteStreams.get(userId) || null;
  }

  getAllRemoteStreams(): Map<string, MediaStream> {
    return this.remoteStreams;
  }

  cleanup(userId: string): void {
    const connection = this.connections.get(userId);
    if (connection) {
      connection.close();
      this.connections.delete(userId);
    }
    
    this.remoteStreams.delete(userId);
    
    // Emit event for UI to handle
    window.dispatchEvent(new CustomEvent('peerDisconnected', {
      detail: { userId }
    }));
  }

  cleanupAll(): void {
    this.connections.forEach((connection, userId) => {
      connection.close();
    });
    
    this.connections.clear();
    this.remoteStreams.clear();
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  getConnectionState(userId: string): RTCPeerConnectionState | null {
    const connection = this.connections.get(userId);
    return connection ? connection.connectionState : null;
  }

  getStats(userId: string): Promise<RTCStatsReport | null> {
    const connection = this.connections.get(userId);
    return connection ? connection.getStats() : Promise.resolve(null);
  }
}

export const webrtcService = new WebRTCService();
export default webrtcService;
