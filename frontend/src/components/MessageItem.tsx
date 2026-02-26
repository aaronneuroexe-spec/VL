import { Message } from '@/types';
import { formatDate, getInitials, generateAvatarColor } from '@/utils';

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
}

export function MessageItem({ message, isOwn }: MessageItemProps) {
  return (
    <div className={`flex space-x-3 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        {message.author.avatar ? (
          <img
            src={message.author.avatar}
            alt={message.author.username}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${generateAvatarColor(message.author.username)}`}
          >
            {getInitials(message.author.username)}
          </div>
        )}
      </div>

      {/* Message content */}
      <div className={`flex-1 max-w-xs lg:max-w-md ${isOwn ? 'text-right' : ''}`}>
        {!isOwn && (
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-medium text-gray-900">
              {message.author.username}
            </span>
            <span className="text-xs text-gray-500">
              {formatDate(message.createdAt)}
            </span>
          </div>
        )}

        <div
          className={`px-4 py-2 rounded-lg ${
            isOwn
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          {message.content && (
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}

          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment, index) => (
                <div key={index} className="text-xs opacity-75">
                  📎 {attachment.name}
                </div>
              ))}
            </div>
          )}

          {message.replyTo && (
            <div className="mt-2 p-2 bg-black bg-opacity-10 rounded text-xs">
              <div className="font-medium">Replying to {message.replyTo.author.username}</div>
              <div className="truncate">{message.replyTo.content}</div>
            </div>
          )}
        </div>

        {isOwn && (
          <div className="flex items-center justify-end space-x-2 mt-1">
            <span className="text-xs text-gray-500">
              {formatDate(message.createdAt)}
            </span>
            {message.editedAt && (
              <span className="text-xs text-gray-400">(edited)</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
