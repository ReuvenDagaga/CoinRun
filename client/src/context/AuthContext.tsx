import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

interface AuthUser {
  id: string;
  username: string;
  email?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: AuthUser, token?: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem('coinrun-auth');
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        setUser(parsed.user);
        setToken(parsed.token);
        setIsAuthenticated(parsed.isAuthenticated);
      } catch (error) {
        console.error('Failed to parse auth from localStorage:', error);
      }
    }
  }, []);

  // Save auth state to localStorage whenever it changes
  useEffect(() => {
    if (user || isAuthenticated) {
      localStorage.setItem('coinrun-auth', JSON.stringify({ user, token, isAuthenticated }));
    } else {
      localStorage.removeItem('coinrun-auth');
    }
  }, [user, token, isAuthenticated]);

  const login = (userData: AuthUser, authToken?: string) => {
    setUser(userData);
    setToken(authToken || null);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  };

  const handleSetLoading = (loading: boolean) => {
    setIsLoading(loading);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated,
      isLoading,
      login,
      logout,
      setLoading: handleSetLoading,
    }),
    [user, token, isAuthenticated, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
