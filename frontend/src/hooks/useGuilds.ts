import { useCallback, useEffect } from 'react';
import { useGuildStore } from '@/store/guilds';
import { apiService } from '@/services/api';
import { Guild, Channel } from '@/types';
import { wsService } from '@/services/websocket';
import { toast } from 'react-hot-toast';

export function useGuilds() {
  const {
    guilds, currentGuild, currentChannel,
    setGuilds, addGuild, updateGuild, removeGuild,
    setCurrentGuild, setCurrentChannel,
    isLoading, setLoading, error, setError,
  } = useGuildStore();

  // ─── Загрузка списка гильдий ──────────────────────────────────────────────

  const loadGuilds = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.get<Guild[]>('/guilds');
      setGuilds(data);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load guilds');
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Загрузить одну гильдию с каналами ────────────────────────────────────

  const selectGuild = useCallback(async (guildId: string) => {
    try {
      setLoading(true);
      const guild = await apiService.get<Guild>(`/guilds/${guildId}`);
      updateGuild(guildId, guild);
      setCurrentGuild(guild);

      // Подписываемся на WS события гильдии
      wsService.joinGuild(guildId);
    } catch (err: any) {
      toast.error('Не удалось загрузить гильдию');
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Создать гильдию ──────────────────────────────────────────────────────

  const createGuild = useCallback(async (name: string, description?: string) => {
    try {
      const guild = await apiService.post<Guild>('/guilds', { name, description });
      addGuild(guild);
      return guild;
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Ошибка';
      toast.error(msg);
      throw err;
    }
  }, []);

  // ─── Вступить по инвайт-коду ──────────────────────────────────────────────

  const joinGuild = useCallback(async (inviteCode: string) => {
    try {
      await apiService.post(`/guilds/join/${inviteCode}`);
      // Перезагружаем список
      await loadGuilds();
      toast.success('Вступил в гильдию!');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Ошибка';
      toast.error(msg);
      throw err;
    }
  }, [loadGuilds]);

  // ─── Превью гильдии по коду ───────────────────────────────────────────────

  const previewGuild = useCallback(async (inviteCode: string) => {
    const data = await apiService.get<Guild>(`/guilds/join/${inviteCode}`);
    return data;
  }, []);

  // ─── Выбрать канал ────────────────────────────────────────────────────────

  const selectChannel = useCallback((channel: Channel) => {
    setCurrentChannel(channel);
    wsService.joinChannel(channel.id);
  }, []);

  // ─── Покинуть гильдию ─────────────────────────────────────────────────────

  const leaveGuild = useCallback(async (guildId: string) => {
    wsService.leaveGuild(guildId);
    removeGuild(guildId);
  }, []);

  return {
    guilds, currentGuild, currentChannel,
    isLoading, error,
    loadGuilds, selectGuild, createGuild, joinGuild,
    previewGuild, selectChannel, leaveGuild,
  };
}
