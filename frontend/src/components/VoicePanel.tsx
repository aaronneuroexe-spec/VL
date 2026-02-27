import { useEffect } from 'react';
import { Mic, MicOff, PhoneOff, Volume2, VolumeX, Monitor, MonitorOff } from 'lucide-react';
import { ConnectionState } from 'livekit-client';
import { Channel } from '@/types';
import { usePeerConnection } from '@/hooks/usePeerConnection';
import { wsService } from '@/services/websocket';

interface VoicePanelProps {
  channel: Channel;
}

function AudioRenderer({ track }: { track: MediaStreamTrack }) {
  useEffect(() => {
    const audio = document.createElement('audio');
    audio.srcObject = new MediaStream([track]);
    audio.autoplay = true;
    audio.style.display = 'none';
    document.body.appendChild(audio);
    return () => { document.body.removeChild(audio); };
  }, [track]);
  return null;
}

export function VoicePanel({ channel }: VoicePanelProps) {
  const {
    participants,
    connectionState,
    isConnected,
    isConnecting,
    isMuted,
    isDeafened,
    isSharingScreen,
    error,
    connect,
    disconnect,
    toggleMute,
    toggleDeafen,
    toggleScreenShare,
  } = usePeerConnection({ channelId: channel.id });

  // Уведомляем бэкенд о входе/выходе из голосового канала
  useEffect(() => {
    if (isConnected) wsService.notifyVoiceJoined(channel.id);
  }, [isConnected, channel.id]);

  const handleDisconnect = async () => {
    wsService.notifyVoiceLeft(channel.id);
    await disconnect();
  };

  return (
    <div className="bg-gray-900 text-white">
      {/* Шапка канала */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-600'}`} />
          <span className="text-sm font-medium">{channel.name}</span>
        </div>
        {isConnecting && (
          <span className="text-xs text-yellow-400 animate-pulse">Подключение...</span>
        )}
      </div>

      {/* Список участников */}
      {isConnected && participants.length > 0 && (
        <div className="px-4 py-2 space-y-1">
          {participants.map((p) => (
            <div key={p.identity} className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${p.isSpeaking ? 'bg-green-400' : 'bg-gray-600'}`} />
              <span className={`text-xs ${p.isSpeaking ? 'text-white' : 'text-gray-400'}`}>
                {p.name ?? p.identity}
                {p.isLocal && ' (вы)'}
              </span>
              {p.isMuted && <MicOff size={10} className="text-red-400 ml-auto" />}
              {/* Рендерим аудио для remote участников */}
              {!p.isLocal && p.audioTrack && <AudioRenderer track={p.audioTrack} />}
            </div>
          ))}
        </div>
      )}

      {/* Ошибка */}
      {error && (
        <div className="mx-4 my-2 px-3 py-2 bg-red-900/50 text-red-300 text-xs rounded">
          {error}
        </div>
      )}

      {/* Панель управления */}
      <div className="flex items-center justify-between px-4 py-3">
        {!isConnected ? (
          <button
            onClick={connect}
            disabled={isConnecting}
            className="w-full py-2 bg-green-600 hover:bg-green-700 rounded-md text-sm font-medium disabled:opacity-50"
          >
            {isConnecting ? 'Подключение...' : 'Войти в канал'}
          </button>
        ) : (
          <div className="flex items-center gap-2 w-full">
            <button
              onClick={toggleMute}
              className={`p-2 rounded-md transition-colors ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'}`}
              title={isMuted ? 'Включить микрофон' : 'Выключить микрофон'}
            >
              {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            <button
              onClick={toggleDeafen}
              className={`p-2 rounded-md transition-colors ${isDeafened ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'}`}
              title={isDeafened ? 'Включить звук' : 'Заглушить всех'}
            >
              {isDeafened ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            <button
              onClick={toggleScreenShare}
              className={`p-2 rounded-md transition-colors ${isSharingScreen ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-700 hover:bg-gray-600'}`}
              title={isSharingScreen ? 'Остановить трансляцию' : 'Показать экран'}
            >
              {isSharingScreen ? <MonitorOff size={16} /> : <Monitor size={16} />}
            </button>

            <button
              onClick={handleDisconnect}
              className="p-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors ml-auto"
              title="Выйти из канала"
            >
              <PhoneOff size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
