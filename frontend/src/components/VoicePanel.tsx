import { useState } from 'react';
import { Mic, MicOff, PhoneOff, Volume2, VolumeX, Settings } from 'lucide-react';
import { Channel } from '@/types';
import { usePeerConnection } from '@/hooks/usePeerConnection';

interface VoicePanelProps {
  channel: Channel;
}

export function VoicePanel({ channel }: VoicePanelProps) {
  const {
    isConnected,
    isConnecting,
    isAudioMuted,
    isVideoMuted,
    connect,
    disconnect,
    toggleAudio,
    toggleVideo,
  } = usePeerConnection({ channelId: channel.id });

  const [isDeafened, setIsDeafened] = useState(false);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Failed to connect to voice channel:', error);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const toggleDeafen = () => {
    setIsDeafened(!isDeafened);
  };

  return (
    <div className="bg-gray-900 text-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm font-medium">
              {channel.name}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Audio toggle */}
          <button
            onClick={toggleAudio}
            className={`p-2 rounded-md transition-colors ${
              isAudioMuted
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            disabled={!isConnected}
          >
            {isAudioMuted ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>

          {/* Deafen toggle */}
          <button
            onClick={toggleDeafen}
            className={`p-2 rounded-md transition-colors ${
              isDeafened
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            disabled={!isConnected}
          >
            {isDeafened ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>

          {/* Video toggle */}
          <button
            onClick={toggleVideo}
            className={`p-2 rounded-md transition-colors ${
              isVideoMuted
                ? 'bg-gray-700 hover:bg-gray-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            disabled={!isConnected}
          >
            {isVideoMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>

          {/* Settings */}
          <button className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors">
            <Settings className="w-5 h-5" />
          </button>

          {/* Connect/Disconnect */}
          {!isConnected ? (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              className="p-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Connection status */}
      {isConnected && (
        <div className="mt-2 text-sm text-gray-300">
          Connected to voice channel
        </div>
      )}
    </div>
  );
}
