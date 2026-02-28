import { useState, useEffect, useRef } from 'react';
import { Smile } from 'lucide-react';
import { Channel, Message } from '@/types';
import { useMessageStore } from '@/store/messages';
import { useAuth } from '@/hooks/useAuth';
import { wsService } from '@/services/websocket';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { debounce } from '@/utils';

interface ChatWindowProps {
  channel: Channel;
}

export function ChatWindow({ channel }: ChatWindowProps) {
  const { user } = useAuth();
  const { messages, typing, isLoading } = useMessageStore();
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const channelMessages = messages[channel.id] || [];
  const channelTyping = typing[channel.id] || new Set();

  const debouncedStopTyping = useRef(
    debounce(() => {
      setIsTyping(false);
      wsService.setTyping(channel.id, false);
    }, 1000)
  ).current;

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !user) return;

    try {
      wsService.sendMessage(channel.id, content);
      setMessage('');
      wsService.setTyping(channel.id, false);
      setIsTyping(false);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleTyping = (value: string) => {
    setMessage(value);

    if (value.trim() && !isTyping) {
      setIsTyping(true);
      wsService.setTyping(channel.id, true);
    }

    debouncedStopTyping();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(message);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800">
      {/* Channel header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div>
          <h2 className="text-lg font-semibold text-white">
            #{channel.name}
          </h2>
          {channel.topic && (
            <p className="text-sm text-gray-400">{channel.topic}</p>
          )}
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <span>{channel.memberCount} members</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={channelMessages}
          isLoading={isLoading}
          channelId={channel.id}
        />
      </div>

      {/* Typing indicators */}
      {channelTyping.size > 0 && (
        <div className="px-4 py-2 text-sm text-gray-400 border-t border-gray-700">
          <div className="flex items-center space-x-1">
            <span>
              {Array.from(channelTyping).map((userId, index) => (
                <span key={userId}>
                  {userId}
                  {index < channelTyping.size - 1 && ', '}
                </span>
              ))}
              {channelTyping.size === 1 ? ' набирает' : ' набирают'} сообщение...
            </span>
          </div>
        </div>
      )}

      {/* Message input */}
      <div className="p-4 border-t border-gray-700">
        <MessageInput
          value={message}
          onChange={handleTyping}
          onSend={handleSendMessage}
          onKeyDown={handleKeyDown}
          placeholder={`Message #${channel.name}`}
          disabled={!user}
        />
      </div>
    </div>
  );
}

