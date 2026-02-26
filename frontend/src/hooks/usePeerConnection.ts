import { useState, useEffect, useCallback, useRef } from 'react';
import { webrtcService } from '@/services/webrtc';
import { wsService } from '@/services/websocket';
import { WebRTCConfig } from '@/types';

interface UsePeerConnectionOptions {
  channelId: string;
  autoConnect?: boolean;
}

interface UsePeerConnectionReturn {
  isConnected: boolean;
  isConnecting: boolean;
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  config: WebRTCConfig | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  getStats: (userId: string) => Promise<RTCStatsReport | null>;
}

export function usePeerConnection({
  channelId,
  autoConnect = false,
}: UsePeerConnectionOptions): UsePeerConnectionReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [config, setConfig] = useState<WebRTCConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isInitialized = useRef(false);

  const initialize = useCallback(async () => {
    if (isInitialized.current) return;

    try {
      setError(null);
      const webrtcConfig = await webrtcService.initialize();
      setConfig(webrtcConfig);
      isInitialized.current = true;
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to initialize WebRTC:', err);
    }
  }, []);

  const connect = useCallback(async () => {
    if (!isInitialized.current) {
      await initialize();
    }

    if (isConnecting || isConnected) return;

    try {
      setIsConnecting(true);
      setError(null);

      // Get user media
      const stream = await webrtcService.getUserMedia({
        audio: true,
        video: false, // Start with audio only
      });

      setLocalStream(stream);
      setIsAudioMuted(false);
      setIsVideoMuted(true);

      // Join the channel
      await webrtcService.joinChannel(channelId);

      setIsConnected(true);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to connect to voice channel:', err);
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, isConnected, channelId, initialize]);

  const disconnect = useCallback(() => {
    webrtcService.cleanupAll();
    setLocalStream(null);
    setRemoteStreams(new Map());
    setIsConnected(false);
    setIsConnecting(false);
    setIsAudioMuted(false);
    setIsVideoMuted(false);
  }, []);

  const toggleAudio = useCallback(() => {
    if (isAudioMuted) {
      webrtcService.unmuteAudio();
      setIsAudioMuted(false);
    } else {
      webrtcService.muteAudio();
      setIsAudioMuted(true);
    }
  }, [isAudioMuted]);

  const toggleVideo = useCallback(() => {
    if (isVideoMuted) {
      webrtcService.unmuteVideo();
      setIsVideoMuted(false);
    } else {
      webrtcService.muteVideo();
      setIsVideoMuted(true);
    }
  }, [isVideoMuted]);

  const getStats = useCallback(async (userId: string) => {
    return webrtcService.getStats(userId);
  }, []);

  // Handle WebRTC signaling events
  useEffect(() => {
    const handleOffer = async (event: CustomEvent) => {
      const { from, offer } = event.detail;
      try {
        await webrtcService.handleOffer(from, offer);
      } catch (err: any) {
        console.error('Failed to handle offer:', err);
        setError(err.message);
      }
    };

    const handleAnswer = async (event: CustomEvent) => {
      const { from, answer } = event.detail;
      try {
        await webrtcService.handleAnswer(from, answer);
      } catch (err: any) {
        console.error('Failed to handle answer:', err);
        setError(err.message);
      }
    };

    const handleIceCandidate = async (event: CustomEvent) => {
      const { from, candidate } = event.detail;
      try {
        await webrtcService.handleIceCandidate(from, candidate);
      } catch (err: any) {
        console.error('Failed to handle ICE candidate:', err);
        setError(err.message);
      }
    };

    const handleRemoteStream = (event: CustomEvent) => {
      const { userId, stream } = event.detail;
      setRemoteStreams(prev => new Map(prev).set(userId, stream));
    };

    const handlePeerConnected = (event: CustomEvent) => {
      const { userId } = event.detail;
      console.log('Peer connected:', userId);
    };

    const handlePeerDisconnected = (event: CustomEvent) => {
      const { userId } = event.detail;
      setRemoteStreams(prev => {
        const newStreams = new Map(prev);
        newStreams.delete(userId);
        return newStreams;
      });
    };

    // Listen to WebSocket signaling events
    const socket = wsService.getSocket();
    if (socket) {
      socket.on('webrtc_offer', handleOffer);
      socket.on('webrtc_answer', handleAnswer);
      socket.on('webrtc_ice', handleIceCandidate);
    }

    // Listen to WebRTC events
    window.addEventListener('remoteStream', handleRemoteStream as EventListener);
    window.addEventListener('peerConnected', handlePeerConnected as EventListener);
    window.addEventListener('peerDisconnected', handlePeerDisconnected as EventListener);

    return () => {
      if (socket) {
        socket.off('webrtc_offer', handleOffer);
        socket.off('webrtc_answer', handleAnswer);
        socket.off('webrtc_ice', handleIceCandidate);
      }

      window.removeEventListener('remoteStream', handleRemoteStream as EventListener);
      window.removeEventListener('peerConnected', handlePeerConnected as EventListener);
      window.removeEventListener('peerDisconnected', handlePeerDisconnected as EventListener);
    };
  }, []);

  // Auto-connect if enabled
  useEffect(() => {
    if (autoConnect && channelId) {
      connect();
    }

    return () => {
      if (channelId) {
        disconnect();
      }
    };
  }, [autoConnect, channelId, connect, disconnect]);

  // Update mute states based on stream
  useEffect(() => {
    if (localStream) {
      setIsAudioMuted(webrtcService.isAudioMuted());
      setIsVideoMuted(webrtcService.isVideoMuted());
    }
  }, [localStream]);

  return {
    isConnected,
    isConnecting,
    localStream,
    remoteStreams,
    isAudioMuted,
    isVideoMuted,
    config,
    error,
    connect,
    disconnect,
    toggleAudio,
    toggleVideo,
    getStats,
  };
}
