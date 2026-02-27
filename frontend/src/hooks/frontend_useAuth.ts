import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { apiService } from '@/services/api';
import { wsService } from '@/services/websocket';

export function useAuth() {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    setUser,
    setLoading,
    setError,
    login,
    logout,
    clearError,
  } = useAuthStore();

  // Авто-подключение WebSocket при авторизации
  useEffect(() => {
    if (isAuthenticated && token) {
      wsService.connect();
    } else {
      wsService.disconnect();
    }
  }, [isAuthenticated, token]);

  // ─── Регистрация ──────────────────────────────────────────────────────────

  const register = async (username: string, email: string, password: string) => {
    try {
      setLoading(true);
      clearError();

      // Создаём пользователя (публичный эндпоинт не требует токена)
      await apiService.post('/auth/register', { username, email, password });

      // После регистрации сразу входим
      const response = await apiService.post<{ access_token: string; user: any }>(
        '/auth/login',
        { username },
      );

      login(response.user, response.access_token);
      wsService.connect();
      return response;
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Registration failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── Вход по инвайт-токену ────────────────────────────────────────────────

  const signIn = async (inviteToken: string, username: string) => {
    try {
      setLoading(true);
      clearError();

      const response = await apiService.post<{ access_token: string; user: any }>(
        '/auth/login',
        { inviteToken, username },
      );

      login(response.user, response.access_token);
      wsService.connect();
      return response;
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Login failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── Отправить magic link ─────────────────────────────────────────────────

  const sendMagicLink = async (email: string) => {
    try {
      setLoading(true);
      clearError();
      await apiService.post('/auth/magic', { email });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to send magic link';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── Верифицировать magic link токен ──────────────────────────────────────

  const verifyMagicLink = async (token: string) => {
    try {
      setLoading(true);
      clearError();

      const response = await apiService.get<{ access_token: string; user: any }>(
        `/auth/verify?token=${token}`,
      );

      login(response.user, response.access_token);
      wsService.connect();
      return response;
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Invalid or expired link';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── Выход ────────────────────────────────────────────────────────────────

  const signOut = () => {
    logout();
    wsService.disconnect();
  };

  // ─── Обновить профиль из API ──────────────────────────────────────────────

  const refreshProfile = async () => {
    if (!isAuthenticated) return;
    try {
      const freshUser = await apiService.get('/auth/me');
      setUser(freshUser);
    } catch (err: any) {
      if (err?.response?.status === 401) signOut();
    }
  };

  const updateProfile = async (updates: Partial<any>) => {
    if (!isAuthenticated || !user) return;
    try {
      const updated = await apiService.patch(`/users/${user.id}`, updates);
      setUser(updated);
      return updated;
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update profile';
      setError(msg);
      throw new Error(msg);
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    register,
    signIn,
    signOut,
    sendMagicLink,
    verifyMagicLink,
    refreshProfile,
    updateProfile,
    clearError,
  };
}
