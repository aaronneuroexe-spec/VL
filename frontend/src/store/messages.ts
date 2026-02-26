import { create } from 'zustand';
import { Message } from '@/types';

interface MessageState {
  messages: Record<string, Message[]>;
  typing: Record<string, Set<string>>;
  isLoading: boolean;
  hasMore: Record<string, boolean>;
  error: string | null;
}

interface MessageActions {
  setMessages: (channelId: string, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (messageId: string) => void;
  setTyping: (channelId: string, userId: string, isTyping: boolean) => void;
  setLoading: (loading: boolean) => void;
  setHasMore: (channelId: string, hasMore: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  clearMessages: (channelId: string) => void;
}

type MessageStore = MessageState & MessageActions;

export const useMessageStore = create<MessageStore>((set, get) => ({
  // State
  messages: {},
  typing: {},
  isLoading: false,
  hasMore: {},
  error: null,

  // Actions
  setMessages: (channelId, messages) => set((state) => ({
    messages: {
      ...state.messages,
      [channelId]: messages,
    },
  })),

  addMessage: (message) => set((state) => ({
    messages: {
      ...state.messages,
      [message.channelId]: [
        ...(state.messages[message.channelId] || []),
        message,
      ],
    },
  })),

  updateMessage: (messageId, updates) => set((state) => {
    const newMessages = { ...state.messages };
    
    Object.keys(newMessages).forEach(channelId => {
      newMessages[channelId] = newMessages[channelId].map(msg =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      );
    });

    return { messages: newMessages };
  }),

  deleteMessage: (messageId) => set((state) => {
    const newMessages = { ...state.messages };
    
    Object.keys(newMessages).forEach(channelId => {
      newMessages[channelId] = newMessages[channelId].filter(msg => msg.id !== messageId);
    });

    return { messages: newMessages };
  }),

  setTyping: (channelId, userId, isTyping) => set((state) => {
    const newTyping = { ...state.typing };
    
    if (!newTyping[channelId]) {
      newTyping[channelId] = new Set();
    }
    
    if (isTyping) {
      newTyping[channelId].add(userId);
    } else {
      newTyping[channelId].delete(userId);
    }

    return { typing: newTyping };
  }),

  setLoading: (isLoading) => set({ isLoading }),

  setHasMore: (channelId, hasMore) => set((state) => ({
    hasMore: {
      ...state.hasMore,
      [channelId]: hasMore,
    },
  })),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  clearMessages: (channelId) => set((state) => {
    const newMessages = { ...state.messages };
    delete newMessages[channelId];
    
    const newTyping = { ...state.typing };
    delete newTyping[channelId];
    
    const newHasMore = { ...state.hasMore };
    delete newHasMore[channelId];

    return {
      messages: newMessages,
      typing: newTyping,
      hasMore: newHasMore,
    };
  }),
}));
