import { useState } from 'react';
import { Plus, Compass, X } from 'lucide-react';
import { Guild } from '@/types';
import { useGuilds } from '@/hooks/useGuilds';
import { useAuth } from '@/hooks/useAuth';
import { cn, getInitials } from '@/utils';
import { toast } from 'react-hot-toast';

interface GuildBarProps {
  guilds: Guild[];
  onGuildSelect: (guild: Guild) => void;
  currentGuildId?: string;
}

// ─── Модалка создания/вступления ───────────────────────────────────────────

function GuildModal({ onClose }: { onClose: () => void }) {
  const { createGuild, joinGuild, previewGuild } = useGuilds();
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [preview, setPreview] = useState<Guild | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setLoading(true);
      await createGuild(name.trim(), description.trim() || undefined);
      toast.success(`Гильдия "${name}" создана!`);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!inviteCode.trim()) return;
    try {
      setLoading(true);
      const g = await previewGuild(inviteCode.trim());
      setPreview(g);
    } catch {
      toast.error('Инвайт-код не найден');
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    try {
      setLoading(true);
      await joinGuild(inviteCode.trim());
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-gray-800 rounded-xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-bold text-lg">
            {tab === 'create' ? 'Создать гильдию' : 'Вступить в гильдию'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Табы */}
        <div className="flex bg-gray-900 rounded-lg p-1 mb-5">
          {(['create', 'join'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setPreview(null); }}
              className={cn(
                'flex-1 py-2 rounded-md text-sm font-medium transition-all',
                tab === t ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
              )}
            >
              {t === 'create' ? 'Создать' : 'Вступить'}
            </button>
          ))}
        </div>

        {tab === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Название *</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Моя гильдия"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Описание</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Расскажи о гильдии..."
                rows={3}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
            >
              {loading ? 'Создаём...' : 'Создать гильдию'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                value={inviteCode}
                onChange={e => { setInviteCode(e.target.value); setPreview(null); }}
                placeholder="Инвайт-код"
                className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 font-mono"
                autoFocus
              />
              <button
                onClick={handlePreview}
                disabled={!inviteCode.trim() || loading}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm disabled:opacity-50"
              >
                Найти
              </button>
            </div>

            {preview && (
              <div className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg border border-gray-700">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {preview.icon ? (
                    <img src={preview.icon} alt={preview.name} className="w-full h-full rounded-xl object-cover" />
                  ) : getInitials(preview.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold truncate">{preview.name}</div>
                  {preview.description && (
                    <div className="text-gray-400 text-xs truncate">{preview.description}</div>
                  )}
                  <div className="text-gray-500 text-xs">Владелец: {preview.owner?.username}</div>
                </div>
              </div>
            )}

            <button
              onClick={handleJoin}
              disabled={!inviteCode.trim() || loading}
              className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
            >
              {loading ? 'Вступаем...' : 'Вступить'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Основной компонент ────────────────────────────────────────────────────

export function GuildBar({ guilds, onGuildSelect, currentGuildId }: GuildBarProps) {
  const { loadGuilds } = useGuilds();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="flex flex-col items-center w-[72px] bg-gray-950 py-3 gap-2 overflow-y-auto scrollbar-hide flex-shrink-0">
        {/* Иконки гильдий */}
        {guilds.map(guild => (
          <GuildIcon
            key={guild.id}
            guild={guild}
            isActive={guild.id === currentGuildId}
            onClick={() => onGuildSelect(guild)}
          />
        ))}

        {/* Разделитель */}
        {guilds.length > 0 && (
          <div className="w-8 h-px bg-gray-700 my-1" />
        )}

        {/* Добавить / Найти */}
        <button
          onClick={() => setShowModal(true)}
          className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-gray-800 hover:bg-green-600 flex items-center justify-center text-green-500 hover:text-white transition-all duration-200 group"
          title="Создать или вступить в гильдию"
        >
          <Plus size={24} />
        </button>
      </div>

      {showModal && (
        <GuildModal onClose={() => { setShowModal(false); loadGuilds(); }} />
      )}
    </>
  );
}

function GuildIcon({ guild, isActive, onClick }: { guild: Guild; isActive: boolean; onClick: () => void }) {
  return (
    <div className="relative group" title={guild.name}>
      {/* Активный индикатор */}
      <div className={cn(
        'absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-white rounded-r-full transition-all duration-200',
        isActive ? 'h-8' : 'h-2 opacity-0 group-hover:opacity-100'
      )} />

      <button
        onClick={onClick}
        className={cn(
          'w-12 h-12 flex items-center justify-center text-white font-bold text-lg transition-all duration-200 flex-shrink-0',
          isActive
            ? 'rounded-[16px] bg-indigo-600'
            : 'rounded-[24px] hover:rounded-[16px] bg-gray-700 hover:bg-indigo-600'
        )}
      >
        {guild.icon ? (
          <img src={guild.icon} alt={guild.name} className="w-full h-full rounded-[inherit] object-cover" />
        ) : (
          <span className="text-sm">{getInitials(guild.name)}</span>
        )}
      </button>
    </div>
  );
}
