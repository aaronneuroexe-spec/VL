import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/hooks/useWebSocket';
import { LoginPage } from '@/pages/LoginPage';
import { HomePage } from '@/pages/HomePage';
import { ChannelPage } from '@/pages/ChannelPage';
import { LoadingSpinner } from '@/components/LoadingSpinner';

function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isConnected } = useWebSocket();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <LoginPage />
            )
          }
        />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <HomePage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/channel/:channelId"
          element={
            isAuthenticated ? (
              <ChannelPage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Connection status indicator */}
      {isAuthenticated && (
        <div className="fixed bottom-4 right-4 z-50">
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
            title={isConnected ? 'Connected' : 'Disconnected'}
          />
        </div>
      )}

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#10b981',
            },
          },
          error: {
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
    </div>
  );
}

export default App;
