import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

type Status = 'loading' | 'success' | 'error';

export function VerifyPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyMagicLink } = useAuth();

  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setErrorMsg('Токен отсутствует в ссылке.');
      return;
    }

    verifyMagicLink(token)
      .then(() => {
        setStatus('success');
        // Небольшая задержка чтобы пользователь увидел успех
        setTimeout(() => navigate('/'), 1500);
      })
      .catch((err) => {
        setStatus('error');
        setErrorMsg(err?.message || 'Ссылка недействительна или истекла.');
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm text-center">

        {/* Логотип */}
        <h1 className="text-2xl font-bold text-white mb-8">VoxLink</h1>

        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">

          {/* Loading */}
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 size={28} className="text-indigo-400 animate-spin" />
              </div>
              <h2 className="text-white font-semibold text-lg mb-2">Проверяем ссылку...</h2>
              <p className="text-gray-400 text-sm">Подожди секунду</p>
            </>
          )}

          {/* Success */}
          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-green-400" />
              </div>
              <h2 className="text-white font-semibold text-lg mb-2">Вход выполнен!</h2>
              <p className="text-gray-400 text-sm">Перенаправляем...</p>
            </>
          )}

          {/* Error */}
          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle size={28} className="text-red-400" />
              </div>
              <h2 className="text-white font-semibold text-lg mb-2">Ссылка недействительна</h2>
              <p className="text-gray-400 text-sm mb-6">{errorMsg}</p>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors text-sm"
              >
                Вернуться на страницу входа
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
