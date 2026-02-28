import { useState, useEffect } from 'react';
import { Hash, Mic, Video, ChevronDown, ChevronRight, Plus, Settings, LogOut, Users, Copy } from 'lucide-react';
import { Guild, Channel, ChannelCategory } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/api';
import { cn, getInitials, generateAvatarColor, copyToClipboard } from '@/utils';
import { toast } from 'react-hot-toast';

interface GuildSidebarProps {
  guild: Guild;
  currentChannelId?: string;
  onChannelSelect: (channel: Channel) => void;
}

const CHANNEL_ICONS = {
  text: Hash,
  voice: Mic,
  stream: Video,
};

// ─── Элемент канала ────────────────────────────────────────────────────────

function ChannelItem({
  channel, isActive, onClick,
}: {
  channel: Channel;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = CHANNEL_ICONS[channel.type] ?? Hash;
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm transition-colors group',
        isActive
          ? 'bg-gray-600/60 text-white'
          : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
      )}
    >
      <Icon size={16} className="flex-shrink-0 opacity-70" />
      <span className="flex-1 text-left truncate">{channel.name}</span>
      {channel.type === 'voice' && channel.memberCount > 0 && (
        <span className="text-xs text-gray-500">{channel.memberCount}</span>
      )}
    </button>
  );
}

// ─── Категория с каналами ──────────────────────────────────────────────────

function CategorySection({
  category, currentChannelId, onChannelSelect,
}: {
  category: ChannelCategory;
  currentChannelId?: string;
  onChannelSelect: (ch: Channel) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-1 px-1 py-1 text-xs font-semibold text-gray-400 hover:text-gray-200 uppercase tracking-wide transition-colors"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
        {category.name}
      </button>

      {!collapsed && (
        <div className="space-y-0.5 mt-0.5">
          {category.channels?.map(ch => (
            <ChannelItem
              key={ch.id}
              channel={ch}
              isActive={ch.id === currentChannelId}
              onClick={() => onChannelSelect(ch)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Панель пользователя внизу ─────────────────────────────────────────────

function UserPanel() {
  const { user, signOut } = useAuth();
  if (!user) return null;

  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
    offline: 'bg-gray-500',
  };

  return (
    <div className="flex items-center gap-2 px-2 py-2 bg-gray-950/50 rounded-lg mt-auto">
      <div className="relative flex-shrink-0">
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold',
          generateAvatarColor(user.username)
        )}>
          {user.avatar
            ? <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
            : getInitials(user.username)
          }
        </div>
        <div className={cn(
          'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-800',
          statusColors[user.status]
        )} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white text-sm font-medium truncate">{user.username}</div>
        <div className="text-gray-400 text-xs capitalize">{user.status}</div>
      </div>
      <button
        onClick={signOut}
        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
        title="Выйти"
      >
        <LogOut size={16} />
      </button>
    </div>
  );
}

// ─── Основной компонент ────────────────────────────────────────────────────

export function GuildSidebar({ guild, currentChannelId, onChannelSelect }: GuildSidebarProps) {
  const [memberCount, setMemberCount] = useState<number | null>(null);

  useEffect(() => {
    apiService.get<any[]>(`/guilds/${guild.id}/members`)
      .then(members => setMemberCount(members.length))
      .catch(() => {});
  }, [guild.id]);

  // Каналы без категории — все каналы гильдии минус те, что в категориях
  const channelsInCategories = guild.categories?.flatMap(c => c.channels ?? []) || [];
  const uncategorized = guild.channels ? guild.channels.filter(ch => !channelsInCategories.find(cc => cc.id === ch.id)) : [];

  const handleCopyInvite = () => {
    if (guild.inviteCode) {
      copyToClipboard(`${window.location.origin}/join/${guild.inviteCode}`);
      toast.success('Ссылка скопирована!');
    }
  };

  return (
    <div className="flex flex-col w-60 bg-gray-800 flex-shrink-0">
      {/* Шапка гильдии */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 shadow-md">
        <h2 className="text-white font-semibold text-sm truncate">{guild.name}</h2>
        <button
          onClick={handleCopyInvite}
          className="p-1 text-gray-400 hover:text-white transition-colors"
          title="Скопировать инвайт"
        >
          <Copy size={14} />
        </button>
      </div>

      {/* Список каналов */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
        {guild.categories?.length ? (
          guild.categories.map(category => (
            <CategorySection
              key={category.id}
              category={category}
              currentChannelId={currentChannelId}
              onChannelSelect={onChannelSelect}
            />
          ))
        ) : (
          <div className="text-gray-500 text-sm text-center py-8">
            Нет каналов
          </div>
        )}
      </div>

      {/* Панель пользователя */}
      <div className="p-2 border-t border-gray-700">
        <UserPanel />
      </div>
    </div>
  );
}
