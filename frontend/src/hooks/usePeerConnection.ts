import { useState, useEffect, useCallback } from 'react';
import { ConnectionState } from 'livekit-client';
import { livekitService, VoiceParticipant } from '@/services/livekit';
import { apiService } from '@/services/api';

interface UseVoiceOptions {
  channelId: string;
  autoConnect?: boolean;
}

interface UseVoiceReturn {
  participants: VoiceParticipant[];
  connectionState: ConnectionState;
  isConnected: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  isSharingScreen: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  toggleMute: () => void;
  toggleDeafen: () => void;
  toggleScreenShare: () => Promise<void>;
}

export function usePeerConnection({ channelId, autoConnect = false }: UseVoiceOptions): UseVoiceReturn {
  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConnected = connectionState === ConnectionState.Connected;
  const isConnecting = connectionState === ConnectionState.Connecting;

  useEffect(() => {
    livekitService.onParticipants(setParticipants);
    livekitService.onState(setConnectionState);
    return () => {
      livekitService.offParticipants && livekitService.offParticipants(setParticipants);
      livekitService.offState && livekitService.offState(setConnectionState);
    };
  }, []);

  const connect = useCallback(async () => {
    if (isConnecting || isConnected) return;
    try {
      setError(null);
      // apiService.post возвращает данные напрямую, без обёртки { data }
      const response = await apiService.post<{ token: string; url: string }>('/livekit/token', { channelId });
      if (!response || !response.token) throw new Error('Failed to get token');
      await livekitService.connect(response.url, response.token);
    } catch (err: any) {
      setError(err.message ?? 'Failed to connect');
    }
  }, [channelId, isConnecting, isConnected]);

  const disconnect = useCallback(async () => {
    await livekitService.disconnect();
    setIsMuted(false);
    setIsDeafened(false);
    setIsSharingScreen(false);
  }, []);

  const toggleMute = useCallback(() => {
    const next = !isMuted;
    livekitService.setMicEnabled(!next);
    setIsMuted(next);
  }, [isMuted]);

  const toggleDeafen = useCallback(() => {
    const next = !isDeafened;
    livekitService.setDeafened(next);
    setIsDeafened(next);
    if (next) livekitService.setMicEnabled(false);
    else livekitService.setMicEnabled(true);
    setIsMuted(next);
  }, [isDeafened]);

  const toggleScreenShare = useCallback(async () => {
    const next = !isSharingScreen;
    await livekitService.setScreenShareEnabled(next);
    setIsSharingScreen(next);
  }, [isSharingScreen]);

  useEffect(() => {
    if (autoConnect && channelId) connect();
    return () => { disconnect(); };
  }, [autoConnect, channelId, connect, disconnect]);

  return {
    participants,
    connectionState,
    isConnected,
    isConnecting,
    isMuted,
    isDeafened,
    isSharingScreen,
    error,
    connect,
    disconnect,
    toggleMute,
    toggleDeafen,
    toggleScreenShare,
  } as UseVoiceReturn;
}
