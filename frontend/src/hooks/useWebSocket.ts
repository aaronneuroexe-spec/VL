import { useEffect, useCallback } from 'react';
import { useWebSocketStore } from '@/store/websocket';
import { useAuthStore } from '@/store/auth';
import { wsService } from '@/services/websocket';

export function useWebSocket() {
  const {
    isConnected,
    isConnecting,
    error,
    setConnected,
    setConnecting,
    setError,
    clearError,
  } = useWebSocketStore();

  const { isAuthenticated, token } = useAuthStore();

  const connect = useCallback(() => {
    if (isAuthenticated && token && !isConnected && !isConnecting) {
      setConnecting(true);
      clearError();
      wsService.connect();
    }
  }, [isAuthenticated, token, isConnected, isConnecting, setConnecting, clearError]);

  const disconnect = useCallback(() => {
    wsService.disconnect();
    setConnected(false);
    setConnecting(false);
  }, [setConnected, setConnecting]);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      connect();
    }, 1000);
  }, [disconnect, connect]);

  // Auto-connect when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      // Only remove listeners; do not forcibly disconnect here to avoid reconnect loop on unmount
      // Actual disconnect should be handled by explicit call or when auth state changes.
    };
  }, [isAuthenticated, token, connect, disconnect]);

  // Handle connection state changes
  useEffect(() => {
    const handleConnect = () => {
      setConnected(true);
      setConnecting(false);
      clearError();
    };

    const handleDisconnect = () => {
      setConnected(false);
      setConnecting(false);
    };

    const handleError = (event: CustomEvent) => {
      setError(event.detail.message);
      setConnecting(false);
    };

    // Listen to WebSocket service events via store updates; remove dead window listeners
    // Keep this effect to derive state from store if needed

    return () => {
      // cleanup if using other event sources
    };
  }, [setConnected, setConnecting, setError, clearError]);

  const joinChannel = useCallback((channelId: string) => {
    if (isConnected) {
      wsService.joinChannel(channelId);
    }
  }, [isConnected]);

  const leaveChannel = useCallback((channelId: string) => {
    if (isConnected) {
      wsService.leaveChannel(channelId);
    }
  }, [isConnected]);

  return {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    reconnect,
    joinChannel,
    leaveChannel,
    clearError,
  };
}

