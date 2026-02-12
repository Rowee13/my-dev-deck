'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import Cookies from 'js-cookie';

interface User {
  id: string;
  email: string;
  name: string | null;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  // Check if user is authenticated
  const checkAuth = useCallback(async () => {
    const token = Cookies.get('accessToken');

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        setAccessToken(token);
      } else {
        // Try to refresh
        await refreshAuth();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  // Load user on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login
  const login = async (email: string, password: string) => {
    const res = await fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Login failed');
    }

    const { accessToken, refreshToken, user } = await res.json();

    // Store tokens in cookies
    Cookies.set('accessToken', accessToken, { expires: 1 }); // 1 day
    Cookies.set('refreshToken', refreshToken, { expires: 30 }); // 30 days

    setAccessToken(accessToken);
    setUser(user);
  };

  // Logout
  const logout = async () => {
    const refreshToken = Cookies.get('refreshToken');

    if (refreshToken) {
      try {
        await fetch(`${apiUrl}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ refreshToken }),
        });
      } catch (error) {
        console.error('Logout request failed:', error);
      }
    }

    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    setUser(null);
    setAccessToken(null);
  };

  // Refresh tokens
  const refreshAuth = async () => {
    const refreshToken = Cookies.get('refreshToken');

    if (!refreshToken) {
      throw new Error('No refresh token');
    }

    const res = await fetch(`${apiUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      setUser(null);
      setAccessToken(null);
      throw new Error('Token refresh failed');
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken, user } = await res.json();

    Cookies.set('accessToken', newAccessToken, { expires: 1 });
    Cookies.set('refreshToken', newRefreshToken, { expires: 30 });

    setAccessToken(newAccessToken);
    setUser(user);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, logout, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
