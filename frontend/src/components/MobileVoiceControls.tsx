import { useState, useEffect } from 'react';
import { Mic, MicOff, PhoneOff, Volume2, VolumeX, Settings } from 'lucide-react';
import { Channel } from '@/types';
import { usePeerConnection } from '@/hooks/usePeerConnection';

interface MobileVoiceControlsProps {
  channel: Channel;
}

export function MobileVoiceControls({ channel }: MobileVoiceControlsProps) {
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
  const [isPushingToTalk, setIsPushingToTalk] = useState(false);
  const [pushToTalkActive, setPushToTalkActive] = useState(false);

  // Handle push-to-talk
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (isPushingToTalk && e.touches.length === 1) {
        setPushToTalkActive(true);
        if (isAudioMuted) {
          toggleAudio();
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isPushingToTalk && pushToTalkActive) {
        setPushToTalkActive(false);
        if (!isAudioMuted) {
          toggleAudio();
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPushingToTalk, pushToTalkActive, isAudioMuted, toggleAudio]);

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

  const togglePushToTalk = () => {
    setIsPushingToTalk(!isPushingToTalk);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 safe-area-pb">
      {/* Connection Status */}
      <div className="flex items-center justify-center mb-4">
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-sm font-medium">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Voice Controls */}
      <div className="grid grid-cols-4 gap-4">
        {/* Audio Toggle */}
        <button
          onClick={toggleAudio}
          disabled={!isConnected}
          className={`flex flex-col items-center justify-center p-4 rounded-lg transition-colors ${
            isAudioMuted
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-gray-700 hover:bg-gray-600'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isAudioMuted ? (
            <MicOff className="w-6 h-6 mb-1" />
          ) : (
            <Mic className="w-6 h-6 mb-1" />
          )}
          <span className="text-xs">Mic</span>
        </button>

        {/* Deafen Toggle */}
        <button
          onClick={toggleDeafen}
          disabled={!isConnected}
          className={`flex flex-col items-center justify-center p-4 rounded-lg transition-colors ${
            isDeafened
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-gray-700 hover:bg-gray-600'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isDeafened ? (
            <VolumeX className="w-6 h-6 mb-1" />
          ) : (
            <Volume2 className="w-6 h-6 mb-1" />
          )}
          <span className="text-xs">Sound</span>
        </button>

        {/* Push-to-Talk Toggle */}
        <button
          onClick={togglePushToTalk}
          disabled={!isConnected}
          className={`flex flex-col items-center justify-center p-4 rounded-lg transition-colors ${
            isPushingToTalk
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-700 hover:bg-gray-600'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <div className={`w-6 h-6 mb-1 rounded-full border-2 ${
            isPushingToTalk 
              ? 'bg-blue-600 border-blue-400' 
              : 'border-gray-400'
          }`} />
          <span className="text-xs">PTT</span>
        </button>

        {/* Disconnect */}
        <button
          onClick={isConnected ? handleDisconnect : handleConnect}
          disabled={isConnecting}
          className={`flex flex-col items-center justify-center p-4 rounded-lg transition-colors ${
            isConnected
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-green-600 hover:bg-green-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isConnected ? (
            <PhoneOff className="w-6 h-6 mb-1" />
          ) : (
            <div className="w-6 h-6 mb-1 rounded-full border-2 border-white" />
          )}
          <span className="text-xs">
            {isConnected ? 'Leave' : isConnecting ? 'Connecting...' : 'Join'}
          </span>
        </button>
      </div>

      {/* Push-to-Talk Indicator */}
      {isPushingToTalk && pushToTalkActive && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-green-500 animate-pulse" />
      )}

      {/* Push-to-Talk Instructions */}
      {isPushingToTalk && !pushToTalkActive && (
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-400">
            Touch and hold anywhere to talk
          </p>
        </div>
      )}
    </div>
  );
}
