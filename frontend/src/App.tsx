import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/hooks/useWebSocket';
import { LoginPage } from '@/pages/LoginPage';
import { VerifyPage } from '@/pages/VerifyPage';
import { HomePage } from '@/pages/HomePage';
import { ChannelPage } from '@/pages/ChannelPage';
import { LoadingSpinner } from '@/components/LoadingSpinner';

function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isConnected } = useWebSocket();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Routes>

        {/* Публичные маршруты */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
        />

        {/* Верификация magic link — всегда доступна, даже если авторизован */}
        <Route path="/auth/verify" element={<VerifyPage />} />

        {/* Защищённые маршруты */}
        <Route
          path="/"
          element={isAuthenticated ? <HomePage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/channel/:channelId"
          element={isAuthenticated ? <ChannelPage /> : <Navigate to="/login" replace />}
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>

      {/* Индикатор соединения */}
      {isAuthenticated && (
        <div className="fixed bottom-4 right-4 z-50">
          <div
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'
            }`}
            title={isConnected ? 'Подключено' : 'Нет соединения'}
          />
        </div>
      )}

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: '#1f2937', color: '#f9fafb', borderRadius: '10px' },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </div>
  );
}

export default App;
