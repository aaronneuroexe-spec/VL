import { create } from 'zustand';
import { Channel } from '@/types';

interface ChannelState {
  channels: Channel[];
  currentChannel: Channel | null;
  isLoading: boolean;
  error: string | null;
}

interface ChannelActions {
  setChannels: (channels: Channel[]) => void;
  addChannel: (channel: Channel) => void;
  updateChannel: (channelId: string, updates: Partial<Channel>) => void;
  removeChannel: (channelId: string) => void;
  setCurrentChannel: (channel: Channel | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

type ChannelStore = ChannelState & ChannelActions;

export const useChannelStore = create<ChannelStore>((set, get) => ({
  // State
  channels: [],
  currentChannel: null,
  isLoading: false,
  error: null,

  // Actions
  setChannels: (channels) => set({ channels }),
  
  addChannel: (channel) => set((state) => ({
    channels: [...state.channels, channel],
  })),
  
  updateChannel: (channelId, updates) => set((state) => ({
    channels: state.channels.map(channel =>
      channel.id === channelId ? { ...channel, ...updates } : channel
    ),
    currentChannel: state.currentChannel?.id === channelId
      ? { ...state.currentChannel, ...updates }
      : state.currentChannel,
  })),
  
  removeChannel: (channelId) => set((state) => ({
    channels: state.channels.filter(channel => channel.id !== channelId),
    currentChannel: state.currentChannel?.id === channelId
      ? null
      : state.currentChannel,
  })),
  
  setCurrentChannel: (channel) => set({ currentChannel: channel }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),
}));
