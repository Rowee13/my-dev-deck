'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import Cookies from 'js-cookie';

interface User {
  id: string;
  email: string;
  name: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  /**
   * Get token metadata from cookie
   * This cookie is NOT httpOnly so JavaScript can read it
   */
  const getTokenMetadata = () => {
    const metaStr = Cookies.get('tokenMeta');
    if (!metaStr) return null;

    try {
      return JSON.parse(metaStr) as { exp: number; iat: number };
    } catch {
      return null;
    }
  };

  /**
   * Schedule proactive token refresh
   * Uses tokenMeta cookie to determine when to refresh
   */
  const scheduleTokenRefresh = useCallback(() => {
    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    const tokenMeta = getTokenMetadata();
    if (!tokenMeta?.exp) return;

    const expirationTime = tokenMeta.exp * 1000; // Convert to milliseconds
    const timeUntilExpiration = expirationTime - Date.now();
    const REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes
    const refreshIn = Math.max(0, timeUntilExpiration - REFRESH_BUFFER);

    console.log(
      `[Auth] Scheduling token refresh in ${Math.floor(refreshIn / 1000)}s`
    );

    refreshTimerRef.current = setTimeout(async () => {
      console.log('[Auth] Proactive token refresh triggered');
      try {
        const res = await fetch(`${apiUrl}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include', // Send httpOnly cookies
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          scheduleTokenRefresh(); // Schedule next refresh
        } else {
          // Refresh failed, redirect to login
          setUser(null);
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('[Auth] Scheduled refresh failed:', error);
        setUser(null);
      }
    }, refreshIn);
  }, [apiUrl]);

  // Check if user is authenticated
  const checkAuth = useCallback(async () => {
    const tokenMeta = getTokenMetadata();

    if (!tokenMeta) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/api/auth/me`, {
        credentials: 'include', // Send httpOnly cookies
      });

      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        scheduleTokenRefresh();
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('[Auth] Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, scheduleTokenRefresh]);

  // Load user on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login
  const login = async (email: string, password: string) => {
    const res = await fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      credentials: 'include', // Receive httpOnly cookies
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Login failed');
    }

    const { user } = await res.json();

    setUser(user);

    // Schedule proactive refresh
    scheduleTokenRefresh();
  };

  // Logout
  const logout = async () => {
    // Clear refresh timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    try {
      const csrfToken = Cookies.get('_csrf');

      await fetch(`${apiUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Send httpOnly cookies
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
        },
      });
    } catch (error) {
      console.error('[Auth] Logout request failed:', error);
    }

    setUser(null);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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
