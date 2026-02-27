import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GuildBar } from './GuildBar';
import { GuildSidebar } from './GuildSidebar';
import { WelcomeScreen } from './WelcomeScreen';
import { ChatWindow } from './ChatWindow';
import { VoicePanel } from './VoicePanel';
import { useGuilds } from '@/hooks/useGuilds';
import { Guild, Channel } from '@/types';

export function Layout() {
  const navigate = useNavigate();
  const {
    guilds, currentGuild, currentChannel,
    loadGuilds, selectGuild, selectChannel,
    isLoading,
  } = useGuilds();

  useEffect(() => {
    loadGuilds();
  }, []);

  const handleGuildSelect = async (guild: Guild) => {
    await selectGuild(guild.id);
  };

  const handleChannelSelect = (channel: Channel) => {
    selectChannel(channel);
    if (channel.type === 'text' || channel.type === 'voice') {
      navigate(`/channel/${channel.id}`);
    }
  };

  return (
    <div className="flex h-screen bg-gray-700 overflow-hidden">
      {/* Полоска гильдий */}
      <GuildBar
        guilds={guilds}
        currentGuildId={currentGuild?.id}
        onGuildSelect={handleGuildSelect}
      />

      {/* Сайдбар каналов — показываем только если выбрана гильдия */}
      {currentGuild ? (
        <GuildSidebar
          guild={currentGuild}
          currentChannelId={currentChannel?.id}
          onChannelSelect={handleChannelSelect}
        />
      ) : (
        // Пустой сайдбар если нет гильдий
        <div className="w-60 bg-gray-800 flex flex-col items-center justify-center flex-shrink-0">
          {isLoading ? (
            <div className="space-y-2 px-4 w-full">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center px-4">
              Выбери гильдию или создай новую
            </p>
          )}
        </div>
      )}

      {/* Главная область */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {currentChannel ? (
          <>
            <div className="flex-1 overflow-hidden">
              <ChatWindow channel={currentChannel} />
            </div>
            {currentChannel.type === 'voice' && (
              <VoicePanel channel={currentChannel} />
            )}
          </>
        ) : (
          <WelcomeScreen />
        )}
      </div>
    </div>
  );
}
