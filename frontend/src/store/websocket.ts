import { create } from 'zustand';

interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

interface WebSocketActions {
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

type WebSocketStore = WebSocketState & WebSocketActions;

export const useWebSocketStore = create<WebSocketStore>((set) => ({
  // State
  isConnected: false,
  isConnecting: false,
  error: null,

  // Actions
  setConnected: (isConnected) => set({ isConnected }),
  setConnecting: (isConnecting) => set({ isConnecting }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
