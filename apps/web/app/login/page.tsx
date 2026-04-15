'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { useAuth } from '../../contexts/AuthContext';
import { tryDemo } from '../../lib/api';

const DEMO_MODE_ENABLED = process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED === 'true';
const DEMO_UNAVAILABLE_KEY = 'demoUnavailable';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoVisible, setDemoVisible] = useState(DEMO_MODE_ENABLED);

  const router = useRouter();
  const { login } = useAuth();

  // If a previous demo attempt returned 404, hide the button for this session
  useEffect(() => {
    if (!DEMO_MODE_ENABLED) return;
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(DEMO_UNAVAILABLE_KEY) === '1') {
      setDemoVisible(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTryDemo = async () => {
    setError('');
    setDemoLoading(true);

    try {
      const res = await tryDemo();

      if (res.status === 201 || res.ok) {
        // Server set httpOnly auth cookies. Mirror the login flow by setting
        // the frontend `session` cookie so middleware recognizes the user,
        // then do a full navigation so AuthContext rehydrates with /api/auth/me.
        Cookies.set('session', 'active', { path: '/', expires: 1 });
        window.location.href = '/dashboard';
        return;
      }

      if (res.status === 429) {
        setError('Demo limit reached, try again later.');
        return;
      }

      if (res.status === 404) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(DEMO_UNAVAILABLE_KEY, '1');
        }
        setDemoVisible(false);
        setError('Demo is not available right now.');
        return;
      }

      // Other error
      let message = 'Could not start demo. Please try again.';
      try {
        const body = await res.json();
        if (body?.message) message = body.message;
      } catch {
        // ignore JSON parse errors
      }
      setError(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start demo.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Dev Deck</h1>
        <p className="text-gray-600 mb-6">Sign in to access your developer tools</p>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              required
              disabled={loading || demoLoading}
              autoComplete="email"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              required
              disabled={loading || demoLoading}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={loading || demoLoading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {demoVisible && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500 mb-3">
              No account? Explore with a demo.
            </p>
            <button
              type="button"
              onClick={handleTryDemo}
              disabled={loading || demoLoading}
              className="w-full px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              {demoLoading ? 'Starting demo...' : 'Try Demo'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
