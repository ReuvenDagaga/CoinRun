import { isTokenExpired } from '@/utils/checkIfIsTokenExpired';
import { CLIENT_CONSTANTS } from '@/utils/constants';
import { IUser } from '@shared/interface/IUser';
import axios from 'axios';
import { createContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface AuthContextValue {
  user: IUser | null;
  token: string | null;
  login: (credential: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

interface GoogleAuthResponse {
  success: boolean;
  data: {
    token: string;
    user: IUser;
    isNewUser: boolean;
  };
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

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;