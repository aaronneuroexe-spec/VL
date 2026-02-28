import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useGuildStore } from '@/store/guilds';
import { useGuilds } from '@/hooks/useGuilds';

export function ChannelPage() {
  const { channelId } = useParams<{ channelId: string }>();
  const { currentGuild } = useGuildStore();
  const { selectChannel } = useGuilds();

  // Если зашли по прямой ссылке — находим канал в текущей гильдии
  useEffect(() => {
    if (!channelId || !currentGuild) return;

    const channel = currentGuild.categories
      ?.flatMap(c => c.channels ?? [])
      .find(ch => ch.id === channelId);

    if (channel) selectChannel(channel);
  }, [channelId, currentGuild, selectChannel]);

  // Layout сам покажет нужный канал через store
  return <Layout />;
}
