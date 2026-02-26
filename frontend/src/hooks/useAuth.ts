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
    setToken,
    setLoading,
    setError,
    login,
    logout,
    clearError,
  } = useAuthStore();

  useEffect(() => {
    // Auto-connect WebSocket when authenticated
    if (isAuthenticated && token) {
      wsService.connect();
    } else {
      wsService.disconnect();
    }

    return () => {
      if (!isAuthenticated) {
        wsService.disconnect();
      }
    };
  }, [isAuthenticated, token]);

  const signIn = async (token: string, username?: string) => {
    try {
      setLoading(true);
      clearError();

      const response = await apiService.post<{
        access_token: string;
        user: any;
      }>('/auth/login', { token, username });

      login(response.user, response.access_token);
      
      // Connect WebSocket
      wsService.connect();
      
      return response;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Login failed';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    logout();
    wsService.disconnect();
  };

  const refreshProfile = async () => {
    if (!isAuthenticated) return;

    try {
      const user = await apiService.get('/auth/me');
      setUser(user);
    } catch (error: any) {
      console.error('Failed to refresh profile:', error);
      if (error?.response?.status === 401) {
        signOut();
      }
    }
  };

  const updateProfile = async (updates: Partial<any>) => {
    if (!isAuthenticated || !user) return;

    try {
      const updatedUser = await apiService.patch(`/users/${user.id}`, updates);
      setUser(updatedUser);
      return updatedUser;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update profile';
      setError(errorMessage);
      throw error;
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    signIn,
    signOut,
    refreshProfile,
    updateProfile,
    clearError,
  };
}
