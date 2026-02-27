import { create } from 'zustand';
import { Guild, Channel, GuildMember } from '@/types';

interface GuildState {
  guilds: Guild[];
  currentGuild: Guild | null;
  currentChannel: Channel | null;
  isLoading: boolean;
  error: string | null;
}

interface GuildActions {
  setGuilds: (guilds: Guild[]) => void;
  addGuild: (guild: Guild) => void;
  updateGuild: (guildId: string, updates: Partial<Guild>) => void;
  removeGuild: (guildId: string) => void;
  setCurrentGuild: (guild: Guild | null) => void;
  setCurrentChannel: (channel: Channel | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useGuildStore = create<GuildState & GuildActions>((set) => ({
  guilds: [],
  currentGuild: null,
  currentChannel: null,
  isLoading: false,
  error: null,

  setGuilds: (guilds) => set({ guilds }),
  addGuild: (guild) => set((s) => ({ guilds: [...s.guilds, guild] })),
  updateGuild: (guildId, updates) => set((s) => ({
    guilds: s.guilds.map(g => g.id === guildId ? { ...g, ...updates } : g),
    currentGuild: s.currentGuild?.id === guildId ? { ...s.currentGuild, ...updates } : s.currentGuild,
  })),
  removeGuild: (guildId) => set((s) => ({
    guilds: s.guilds.filter(g => g.id !== guildId),
    currentGuild: s.currentGuild?.id === guildId ? null : s.currentGuild,
  })),
  setCurrentGuild: (guild) => set({ currentGuild: guild, currentChannel: null }),
  setCurrentChannel: (channel) => set({ currentChannel: channel }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
