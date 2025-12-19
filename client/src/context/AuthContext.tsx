import { isTokenExpired } from '@/utils/checkIfIsTokenExpired';
import { CLIENT_CONSTANTS } from '@/lib/constants';
import { IUser } from '@shared/interface/IUser';
import { IUpgrades } from '@shared/interface/IUpgrades';
import { calculatePowerLevel, calculateUpgradeCost, GAME_CONSTANTS } from '@shared/types/game.types';
import axios from 'axios';
import { createContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';

interface AuthContextValue {
  user: IUser | null;
  token: string | null;
  isLoading: boolean;
  powerLevel: number;
  login: (credential: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<IUser>) => Promise<void>;

  // Helper methods for common operations
  addCoins: (amount: number) => Promise<void>;
  spendCoins: (amount: number) => Promise<boolean>;
  addGems: (amount: number) => Promise<void>;
  spendGems: (amount: number) => Promise<boolean>;
  purchaseUpgrade: (type: keyof IUpgrades) => Promise<boolean>;
  canAffordUpgrade: (type: keyof IUpgrades) => boolean;
  getUpgradeCost: (type: keyof IUpgrades) => number;
  purchaseSkin: (skinId: string, price: { coins?: number; gems?: number }) => Promise<boolean>;
  equipSkin: (skinId: string) => Promise<void>;
  updateStats: (gameResult: { coinsCollected: number; distanceTraveled: number; won: boolean; armySize: number }) => Promise<void>;
  unlockAchievement: (achievementId: string) => Promise<void>;
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

  // Calculate power level whenever user changes
  const powerLevel = useMemo(() => {
    if (!user?.upgrades) return 0;
    return calculatePowerLevel(user.upgrades);
  }, [user?.upgrades]);

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

  // Helper methods for common operations
  const addCoins = useCallback(async (amount: number) => {
    if (!user) return;
    await updateUser({ coins: user.coins + amount });
  }, [user, updateUser]);

  const spendCoins = useCallback(async (amount: number): Promise<boolean> => {
    if (!user || user.coins < amount) return false;
    try {
      await updateUser({ coins: user.coins - amount });
      return true;
    } catch {
      return false;
    }
  }, [user, updateUser]);

  const addGems = useCallback(async (amount: number) => {
    if (!user) return;
    await updateUser({ gems: user.gems + amount });
  }, [user, updateUser]);

  const spendGems = useCallback(async (amount: number): Promise<boolean> => {
    if (!user || user.gems < amount) return false;
    try {
      await updateUser({ gems: user.gems - amount });
      return true;
    } catch {
      return false;
    }
  }, [user, updateUser]);

  const getUpgradeCost = useCallback((type: keyof IUpgrades): number => {
    if (!user) return 0;
    return calculateUpgradeCost(type, user.upgrades[type]);
  }, [user]);

  const canAffordUpgrade = useCallback((type: keyof IUpgrades): boolean => {
    if (!user) return false;
    return user.coins >= getUpgradeCost(type);
  }, [user, getUpgradeCost]);

  const purchaseUpgrade = useCallback(async (type: keyof IUpgrades): Promise<boolean> => {
    if (!user || !canAffordUpgrade(type)) return false;

    const maxLevel = GAME_CONSTANTS.MAX_LEVELS[type];
    if (user.upgrades[type] >= maxLevel) return false;

    const cost = getUpgradeCost(type);
    const newUpgrades = { ...user.upgrades, [type]: user.upgrades[type] + 1 };

    try {
      await updateUser({
        coins: user.coins - cost,
        upgrades: newUpgrades
      });
      return true;
    } catch {
      return false;
    }
  }, [user, canAffordUpgrade, getUpgradeCost, updateUser]);

  const purchaseSkin = useCallback(async (skinId: string, price: { coins?: number; gems?: number }): Promise<boolean> => {
    if (!user || user.ownedSkins.includes(skinId)) return false;

    if (price.gems && price.gems > 0) {
      if (user.gems < price.gems) return false;
      try {
        await updateUser({
          gems: user.gems - price.gems,
          ownedSkins: [...user.ownedSkins, skinId]
        });
        return true;
      } catch {
        return false;
      }
    }

    if (price.coins && price.coins > 0) {
      if (user.coins < price.coins) return false;
      try {
        await updateUser({
          coins: user.coins - price.coins,
          ownedSkins: [...user.ownedSkins, skinId]
        });
        return true;
      } catch {
        return false;
      }
    }

    return false;
  }, [user, updateUser]);

  const equipSkin = useCallback(async (skinId: string) => {
    if (!user || !user.ownedSkins.includes(skinId)) return;
    await updateUser({ currentSkin: skinId });
  }, [user, updateUser]);

  const updateStats = useCallback(async (gameResult: { coinsCollected: number; distanceTraveled: number; won: boolean; armySize: number }) => {
    if (!user) return;

    await updateUser({
      gamesPlayed: user.gamesPlayed + 1,
      gamesWon: user.gamesWon + (gameResult.won ? 1 : 0),
      totalDistance: user.totalDistance + gameResult.distanceTraveled,
      totalCoinsCollected: user.totalCoinsCollected + gameResult.coinsCollected,
      highestArmy: Math.max(user.highestArmy, gameResult.armySize),
      coins: user.coins + gameResult.coinsCollected
    });
  }, [user, updateUser]);

  const unlockAchievement = useCallback(async (achievementId: string) => {
    if (!user || user.achievements.some(a => a.achievementId === achievementId)) return;

    await updateUser({
      achievements: [...user.achievements, {
        achievementId,
        progress: 100,
        unlocked: true,
        unlockedAt: new Date()
      }]
    });
  }, [user, updateUser]);

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
    powerLevel,
    login,
    logout,
    updateUser,
    addCoins,
    spendCoins,
    addGems,
    spendGems,
    purchaseUpgrade,
    canAffordUpgrade,
    getUpgradeCost,
    purchaseSkin,
    equipSkin,
    updateStats,
    unlockAchievement,
  }), [
    user,
    token,
    isLoading,
    powerLevel,
    login,
    logout,
    updateUser,
    addCoins,
    spendCoins,
    addGems,
    spendGems,
    purchaseUpgrade,
    canAffordUpgrade,
    getUpgradeCost,
    purchaseSkin,
    equipSkin,
    updateStats,
    unlockAchievement,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
