import { useEffect, useRef } from 'react';
import { Message } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { MessageItem } from './MessageItem';
import { LoadingSpinner } from './LoadingSpinner';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  channelId: string;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto scrollbar-hide">
      <div className="p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet. Be the first to say something!</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              isOwn={message.authorId === user?.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
