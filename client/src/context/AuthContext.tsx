import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import type { BasicUserResponse } from '@shared/types/user.types';

/**
 * AuthContext stores minimal authentication data (user identity + token)
 * For full user data (stats, upgrades, etc.), use UserContext
 */
interface AuthContextValue {
  user: BasicUserResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: BasicUserResponse, token?: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<BasicUserResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = !!user && !!token;

  useEffect(() => {
    const stored = localStorage.getItem('coinrun-auth');
    if (!stored) return;
    
    try {
      const { user, token } = JSON.parse(stored);
      setUser(user);
      setToken(token);
    } catch {
      localStorage.removeItem('coinrun-auth');
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('coinrun-auth', JSON.stringify({ user, token }));
    } else {
      localStorage.removeItem('coinrun-auth');
    }
  }, [user, token, isAuthenticated]);

  const value = useMemo(() => ({
    user,
    token,
    isAuthenticated,
    isLoading,
    login: (userData: BasicUserResponse, authToken?: string) => {
      setUser(userData);
      setToken(authToken || null);
    },
    logout: () => {
      setUser(null);
      setToken(null);
    },
    setLoading,
  }), [user, token, isAuthenticated, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

