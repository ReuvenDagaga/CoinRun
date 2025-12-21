import { isTokenExpired } from '@/lib/utils/validation';
import { CLIENT_CONSTANTS } from '@/lib/constants';
import { IUser } from '@shared/interface/IUser';
import axios from 'axios';
import { createContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';

interface AuthContextValue {
  user: IUser | null;
  token: string | null;
  isLoading: boolean;
  login: (credential: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<IUser>) => Promise<void>;
}

interface GoogleAuthResponse {
  success: boolean;
  data: {
    token: string;
    user: IUser;
    isNewUser: boolean;
  };
}

interface UpdateUserResponse {
  success: boolean;
  data: IUser;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("coinrun-auth");
    localStorage.removeItem("token");
  }, []);

  const login = useCallback(async (credential: string): Promise<void> => {
    const { data } = await axios.post<GoogleAuthResponse>(
      `${CLIENT_CONSTANTS.API_BASE_URL}/auth/google`,
      { credential }
    );

    if (!data.success) {
      throw new Error('Authentication failed');
    }

    setUser(data.data.user);
    setToken(data.data.token);
    localStorage.setItem("coinrun-auth", JSON.stringify(data.data.user));
    localStorage.setItem("token", data.data.token);
  }, []);

  // Main updateUser function - syncs with server
  const updateUser = useCallback(async (updates: Partial<IUser>): Promise<void> => {
    if (!token || !user) return;

    try {
      const { data } = await axios.put<UpdateUserResponse>(
        `${CLIENT_CONSTANTS.API_BASE_URL}/user/update`,
        updates,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (data.success) {
        setUser(data.data);
        localStorage.setItem("coinrun-auth", JSON.stringify(data.data));
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  }, [token, user]);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("coinrun-auth");

    if (savedToken && savedUser && !isTokenExpired(savedToken)) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    } else if (savedToken) {
      logout();
    }
    setIsLoading(false);
  }, [logout]);

  const value = useMemo(() => ({
    user,
    token,
    isLoading,
    login,
    logout,
    updateUser,
  }), [
    user,
    token,
    isLoading,
    login,
    logout,
    updateUser,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
