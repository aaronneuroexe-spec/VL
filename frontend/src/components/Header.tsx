import { User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/hooks/useWebSocket';
import { cn, getInitials, generateAvatarColor } from '@/utils';

export function Header() {
  const { user, signOut } = useAuth();
  const { isConnected } = useWebSocket();

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">VoxLink</h1>
          
          {/* Connection status */}
          <div className="flex items-center space-x-2">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                isConnected ? 'bg-green-500' : 'bg-red-500'
              )}
            />
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* User info */}
          {user && (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium',
                      generateAvatarColor(user.username)
                    )}
                  >
                    {getInitials(user.username)}
                  </div>
                )}
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{user.username}</div>
                  <div className="text-gray-500 capitalize">{user.status}</div>
                </div>
              </div>

              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md">
                <Settings className="w-5 h-5" />
              </button>

              <button
                onClick={signOut}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
