import { Send, Paperclip, Smile } from 'lucide-react';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MessageInput({
  value,
  onChange,
  onSend,
  onKeyDown,
  placeholder = 'Type a message...',
  disabled = false,
}: MessageInputProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSend(value);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end space-x-2">
      <div className="flex-1">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ minHeight: '40px', maxHeight: '120px' }}
        />
      </div>

      <div className="flex items-center space-x-1">
        <button
          type="button"
          disabled={disabled}
          className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <button
          type="button"
          disabled={disabled}
          className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Smile className="w-5 h-5" />
        </button>

        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}
