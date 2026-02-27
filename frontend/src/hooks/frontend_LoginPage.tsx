import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Mail, Key, ArrowRight, Loader2, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

type Mode = 'invite' | 'magic' | 'register';

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signIn, sendMagicLink, register, isLoading, clearError } = useAuth();

  const [mode, setMode] = useState<Mode>('invite');
  const [username, setUsername] = useState('');
  const [inviteToken, setInviteToken] = useState(searchParams.get('invite') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (m: Mode) => {
    setMode(m);
    clearError();
    setMagicSent(false);
  };

  // ─── Регистрация ─────────────────────────────────────────────────────────

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return toast.error('Введи имя пользователя');
    if (!email.trim()) return toast.error('Введи email');
    if (!password.trim()) return toast.error('Введи пароль');
    if (password.length < 6) return toast.error('Пароль минимум 6 символов');
    if (password !== confirmPassword) return toast.error('Пароли не совпадают');

    try {
      setSubmitting(true);
      await register(username.trim(), email.trim(), password);
      toast.success('Добро пожаловать в VoxLink!');
      navigate('/');
    } catch (err: any) {
      toast.error(err?.message || 'Ошибка регистрации');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Вход по инвайту ────────────────────────────────────────────────────

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return toast.error('Введи имя пользователя');

    try {
      setSubmitting(true);
      await signIn(inviteToken.trim(), username.trim());
      toast.success('Добро пожаловать в VoxLink!');
      navigate('/');
    } catch (err: any) {
      toast.error(err?.message || 'Ошибка входа');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Magic Link ─────────────────────────────────────────────────────────

  const handleMagicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return toast.error('Введи email');

    try {
      setSubmitting(true);
      await sendMagicLink(email.trim());
      setMagicSent(true);
    } catch (err: any) {
      toast.error(err?.message || 'Не удалось отправить ссылку');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md">

        {/* Логотип */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">VoxLink</h1>
          <p className="text-gray-400 mt-2 text-sm">Голосовая платформа для геймеров</p>
        </div>

        {/* Карточка */}
        <div className="bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-800">

          {/* Переключатель режима */}
          <div className="flex rounded-lg bg-gray-800 p-1 mb-6">
            <button
              onClick={() => switchMode('register')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-all ${
                mode === 'register'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <UserPlus size={14} />
              Регистрация
            </button>
            <button
              onClick={() => switchMode('invite')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-all ${
                mode === 'invite'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Key size={14} />
              Инвайт
            </button>
            <button
              onClick={() => switchMode('magic')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-all ${
                mode === 'magic'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Mail size={14} />
              Magic Link
            </button>
          </div>

          {/* ── Режим: Регистрация ── */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Имя пользователя
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="gamertag"
                  className={inputClass}
                  autoComplete="off"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Пароль
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Минимум 6 символов"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Повтори пароль
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Повтори пароль"
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                disabled={submitting || isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors mt-2"
              >
                {submitting ? (
                  <><Loader2 size={16} className="animate-spin" /> Регистрация...</>
                ) : (
                  <>Создать аккаунт <ArrowRight size={16} /></>
                )}
              </button>
            </form>
          )}

          {/* ── Режим: Инвайт ── */}
          {mode === 'invite' && (
            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Имя пользователя
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="gamertag"
                  className={inputClass}
                  autoComplete="off"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Инвайт-токен <span className="text-gray-500">(необязательно)</span>
                </label>
                <input
                  type="text"
                  value={inviteToken}
                  onChange={e => setInviteToken(e.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className={`${inputClass} font-mono text-sm`}
                />
              </div>

              <button
                type="submit"
                disabled={submitting || isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors mt-2"
              >
                {submitting ? (
                  <><Loader2 size={16} className="animate-spin" /> Вход...</>
                ) : (
                  <>Войти <ArrowRight size={16} /></>
                )}
              </button>

              <p className="text-center text-xs text-gray-500">
                Нет аккаунта?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="text-indigo-400 hover:text-indigo-300"
                >
                  Зарегистрируйся
                </button>
              </p>
            </form>
          )}

          {/* ── Режим: Magic Link ── */}
          {mode === 'magic' && (
            <>
              {magicSent ? (
                <div className="text-center py-4">
                  <div className="w-14 h-14 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail size={24} className="text-indigo-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">Проверь почту</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Отправили ссылку на <span className="text-indigo-400">{email}</span>.
                    Она действует 1 час.
                  </p>
                  <button
                    onClick={() => { setMagicSent(false); setEmail(''); }}
                    className="text-sm text-gray-500 hover:text-gray-300"
                  >
                    Отправить на другой адрес
                  </button>
                </div>
              ) : (
                <form onSubmit={handleMagicSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={inputClass}
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || isLoading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                  >
                    {submitting ? (
                      <><Loader2 size={16} className="animate-spin" /> Отправка...</>
                    ) : (
                      <><Mail size={16} /> Отправить ссылку</>
                    )}
                  </button>

                  <p className="text-center text-xs text-gray-500">
                    Отправим ссылку для входа без пароля.
                  </p>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
