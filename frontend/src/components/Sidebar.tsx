import { useState, useEffect } from 'react';
import { Plus, Hash, Mic, Video, Calendar } from 'lucide-react';
import { useChannelStore } from '@/store/channels';
import { Channel } from '@/types';
import { apiService } from '@/services/api';
import { cn } from '@/utils';

export function Sidebar() {
  const { channels, currentChannel, setChannels, setCurrentChannel } = useChannelStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      setIsLoading(true);
      const channels = await apiService.get<Channel[]>('/channels');
      setChannels(channels);
    } catch (error) {
      console.error('Failed to load channels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getChannelIcon = (channel: Channel) => {
    switch (channel.type) {
      case 'voice':
        return <Mic className="w-4 h-4" />;
      case 'stream':
        return <Video className="w-4 h-4" />;
      default:
        return <Hash className="w-4 h-4" />;
    }
  };

  const getChannelTypeColor = (channel: Channel) => {
    switch (channel.type) {
      case 'voice':
        return 'text-green-600';
      case 'stream':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="sidebar">
        <div className="p-4">
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-6 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Channels
          </h2>
          <button className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <nav className="space-y-1">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setCurrentChannel(channel)}
              className={cn(
                'w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                currentChannel?.id === channel.id
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <span className={cn(getChannelTypeColor(channel))}>
                {getChannelIcon(channel)}
              </span>
              <span className="flex-1 text-left truncate">{channel.name}</span>
              {channel.memberCount > 0 && (
                <span className="text-xs text-gray-500">
                  {channel.memberCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Events section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Events
            </h2>
            <button className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            <button className="w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
              <Calendar className="w-4 h-4 text-gray-600" />
              <span>Upcoming Events</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
