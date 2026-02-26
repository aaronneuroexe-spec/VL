import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { ChatWindow } from '@/components/ChatWindow';
import { VoicePanel } from '@/components/VoicePanel';
import { useChannelStore } from '@/store/channels';
import { useWebSocket } from '@/hooks/useWebSocket';

export function ChannelPage() {
  const { channelId } = useParams<{ channelId: string }>();
  const { channels, currentChannel, setCurrentChannel } = useChannelStore();
  const { joinChannel, leaveChannel } = useWebSocket();

  useEffect(() => {
    if (channelId) {
      const channel = channels.find(c => c.id === channelId);
      if (channel) {
        setCurrentChannel(channel);
        joinChannel(channelId);
      }
    }

    return () => {
      if (channelId) {
        leaveChannel(channelId);
      }
    };
  }, [channelId, channels, setCurrentChannel, joinChannel, leaveChannel]);

  if (!currentChannel) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Channel not found</h2>
            <p className="text-gray-600">The channel you're looking for doesn't exist or you don't have access to it.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex h-full">
        <div className="flex-1 flex flex-col">
          <ChatWindow channel={currentChannel} />
          {currentChannel.type === 'voice' && (
            <VoicePanel channel={currentChannel} />
          )}
        </div>
      </div>
    </Layout>
  );
}
