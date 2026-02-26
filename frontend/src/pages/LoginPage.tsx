import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signIn, isLoading } = useAuth();
  
  const [username, setUsername] = useState('');
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token.trim()) {
      toast.error('Please enter an invite token');
      return;
    }

    if (!username.trim()) {
      toast.error('Please enter a username');
      return;
    }

    try {
      setIsSubmitting(true);
      await signIn(token, username);
      toast.success('Welcome to VoxLink!');
      navigate('/');
    } catch (error: any) {
      toast.error(error?.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to VoxLink
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your invite token to join the voice communication platform
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input mt-1"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-700">
                Invite Token
              </label>
              <input
                id="token"
                name="token"
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="input mt-1"
                placeholder="Enter your invite token"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-2 px-4 text-sm font-medium"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Need an invite? Contact your community administrator.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
