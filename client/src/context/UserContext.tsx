import { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback } from 'react';
import type { UserUpgrades, UserStats, Achievement } from '@shared/types/game.types';
import { calculatePowerLevel, calculateUpgradeCost, GAME_CONSTANTS } from '@shared/types/game.types';
import { useAuth } from './AuthContext';

interface UserData {
  id: string;
  username: string;
  email?: string;
  usdtBalance: number;
  coins: number;
  gems: number;
  currentSkin: string;
  ownedSkins: string[];
  upgrades: UserUpgrades;
  stats: UserStats;
  dailyMissionsCompleted: string[];
  lastDailyReward: string | null;
  spinUsedToday: boolean;
  dailyStreak: number;
  achievements: Achievement[];
}

interface UserContextValue {
  userData: UserData | null;
  powerLevel: number;

  // Balance actions
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  addGems: (amount: number) => void;
  spendGems: (amount: number) => boolean;
  addUsdt: (amount: number) => void;
  spendUsdt: (amount: number) => boolean;

  // Upgrade actions
  purchaseUpgrade: (type: keyof UserUpgrades) => boolean;
  canAffordUpgrade: (type: keyof UserUpgrades) => boolean;
  getUpgradeCost: (type: keyof UserUpgrades) => number;

  // Skin actions
  purchaseSkin: (skinId: string, price: { coins?: number; gems?: number }) => boolean;
  equipSkin: (skinId: string) => void;

  // Stats actions
  updateStats: (gameResult: { coinsCollected: number; distanceTraveled: number; won: boolean; armySize: number }) => void;

  // Daily actions
  claimDailyReward: () => { coins: number; gems?: number } | null;
  useDailySpin: () => boolean;
  resetDailyProgress: () => void;

  // Achievement actions
  unlockAchievement: (achievementId: string) => void;

  // Initialize user data
  initializeUserData: (data: UserData) => void;
  clearUserData: () => void;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

const defaultUpgrades: UserUpgrades = {
  capacity: 0,
  addWarrior: 0,
  warriorUpgrade: 0,
  income: 0,
  speed: 0,
  jump: 0,
  bulletPower: 0,
  magnetRadius: 0
};

const defaultStats: UserStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  totalDistance: 0,
  totalCoinsCollected: 0,
  highestArmy: 0
};

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const { user: authUser } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [powerLevel, setPowerLevel] = useState(0);

  // Load user data from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('coinrun-user-data');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserData(parsed.userData);
        setPowerLevel(parsed.powerLevel);
      } catch (error) {
        console.error('Failed to parse user data from localStorage:', error);
      }
    }
  }, []);

  // Clear user data when user logs out
  useEffect(() => {
    if (!authUser && userData) {
      setUserData(null);
      setPowerLevel(0);
      localStorage.removeItem('coinrun-user-data');
    }
  }, [authUser, userData]);

  // Save user data to localStorage whenever it changes
  useEffect(() => {
    if (userData) {
      localStorage.setItem('coinrun-user-data', JSON.stringify({ userData, powerLevel }));
    }
  }, [userData, powerLevel]);

  const initializeUserData = useCallback((data: UserData) => {
    setUserData(data);
    setPowerLevel(calculatePowerLevel(data.upgrades));
  }, []);

  const clearUserData = useCallback(() => {
    setUserData(null);
    setPowerLevel(0);
    localStorage.removeItem('coinrun-user-data');
  }, []);

  const addCoins = useCallback((amount: number) => {
    setUserData(prev => {
      if (!prev) return prev;
      return { ...prev, coins: prev.coins + amount };
    });
  }, []);

  const spendCoins = useCallback((amount: number): boolean => {
    let success = false;
    setUserData(prev => {
      if (!prev || prev.coins < amount) {
        success = false;
        return prev;
      }
      success = true;
      return { ...prev, coins: prev.coins - amount };
    });
    return success;
  }, []);

  const addGems = useCallback((amount: number) => {
    setUserData(prev => {
      if (!prev) return prev;
      return { ...prev, gems: prev.gems + amount };
    });
  }, []);

  const spendGems = useCallback((amount: number): boolean => {
    let success = false;
    setUserData(prev => {
      if (!prev || prev.gems < amount) {
        success = false;
        return prev;
      }
      success = true;
      return { ...prev, gems: prev.gems - amount };
    });
    return success;
  }, []);

  const addUsdt = useCallback((amount: number) => {
    setUserData(prev => {
      if (!prev) return prev;
      return { ...prev, usdtBalance: prev.usdtBalance + amount };
    });
  }, []);

  const spendUsdt = useCallback((amount: number): boolean => {
    let success = false;
    setUserData(prev => {
      if (!prev || prev.usdtBalance < amount) {
        success = false;
        return prev;
      }
      success = true;
      return { ...prev, usdtBalance: prev.usdtBalance - amount };
    });
    return success;
  }, []);

  const getUpgradeCost = useCallback((type: keyof UserUpgrades): number => {
    if (!userData) return 0;
    return calculateUpgradeCost(type, userData.upgrades[type]);
  }, [userData]);

  const canAffordUpgrade = useCallback((type: keyof UserUpgrades): boolean => {
    if (!userData) return false;
    const cost = getUpgradeCost(type);
    return userData.coins >= cost;
  }, [userData, getUpgradeCost]);

  const purchaseUpgrade = useCallback((type: keyof UserUpgrades): boolean => {
    if (!userData) return false;

    const maxLevel = GAME_CONSTANTS.MAX_LEVELS[type];
    if (userData.upgrades[type] >= maxLevel) return false;

    if (!canAffordUpgrade(type)) return false;

    const cost = getUpgradeCost(type);
    if (userData.coins < cost) return false;

    const newUpgrades = {
      ...userData.upgrades,
      [type]: userData.upgrades[type] + 1
    };

    const newPowerLevel = calculatePowerLevel(newUpgrades);

    setUserData({
      ...userData,
      coins: userData.coins - cost,
      upgrades: newUpgrades
    });
    setPowerLevel(newPowerLevel);

    return true;
  }, [userData, canAffordUpgrade, getUpgradeCost]);

  const purchaseSkin = useCallback((skinId: string, price: { coins?: number; gems?: number }): boolean => {
    if (!userData) return false;
    if (userData.ownedSkins.includes(skinId)) return false;

    if (price.gems && price.gems > 0) {
      if (userData.gems < price.gems) return false;
      setUserData({
        ...userData,
        gems: userData.gems - price.gems,
        ownedSkins: [...userData.ownedSkins, skinId]
      });
      return true;
    } else if (price.coins && price.coins > 0) {
      if (userData.coins < price.coins) return false;
      setUserData({
        ...userData,
        coins: userData.coins - price.coins,
        ownedSkins: [...userData.ownedSkins, skinId]
      });
      return true;
    }

    return false;
  }, [userData]);

  const equipSkin = useCallback((skinId: string) => {
    if (!userData) return;
    if (!userData.ownedSkins.includes(skinId)) return;

    setUserData({ ...userData, currentSkin: skinId });
  }, [userData]);

  const updateStats = useCallback((gameResult: { coinsCollected: number; distanceTraveled: number; won: boolean; armySize: number }) => {
    setUserData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        stats: {
          gamesPlayed: prev.stats.gamesPlayed + 1,
          gamesWon: prev.stats.gamesWon + (gameResult.won ? 1 : 0),
          totalDistance: prev.stats.totalDistance + gameResult.distanceTraveled,
          totalCoinsCollected: prev.stats.totalCoinsCollected + gameResult.coinsCollected,
          highestArmy: Math.max(prev.stats.highestArmy, gameResult.armySize)
        }
      };
    });
  }, []);

  const claimDailyReward = useCallback((): { coins: number; gems?: number } | null => {
    if (!userData) return null;

    const today = new Date().toDateString();
    if (userData.lastDailyReward === today) return null;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isConsecutive = userData.lastDailyReward === yesterday.toDateString();
    const newStreak = isConsecutive ? Math.min(userData.dailyStreak + 1, 7) : 1;

    const rewards = [
      { coins: 50 },
      { coins: 75 },
      { coins: 100, gems: 10 },
      { coins: 150 },
      { coins: 200, gems: 25 },
      { coins: 300 },
      { coins: 500, gems: 50 }
    ];

    const reward = rewards[newStreak - 1];

    setUserData({
      ...userData,
      coins: userData.coins + reward.coins,
      gems: userData.gems + (reward.gems || 0),
      lastDailyReward: today,
      dailyStreak: newStreak
    });

    return reward;
  }, [userData]);

  const useDailySpin = useCallback((): boolean => {
    if (!userData || userData.spinUsedToday) return false;

    setUserData({ ...userData, spinUsedToday: true });
    return true;
  }, [userData]);

  const resetDailyProgress = useCallback(() => {
    setUserData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        dailyMissionsCompleted: [],
        spinUsedToday: false
      };
    });
  }, []);

  const unlockAchievement = useCallback((achievementId: string) => {
    setUserData(prev => {
      if (!prev) return prev;
      if (prev.achievements.some(a => a.id === achievementId)) return prev;

      return {
        ...prev,
        achievements: [
          ...prev.achievements,
          { id: achievementId, name: '', description: '', reward: {}, unlockedAt: new Date() }
        ]
      };
    });
  }, []);

  const value = useMemo(
    () => ({
      userData,
      powerLevel,
      addCoins,
      spendCoins,
      addGems,
      spendGems,
      addUsdt,
      spendUsdt,
      purchaseUpgrade,
      canAffordUpgrade,
      getUpgradeCost,
      purchaseSkin,
      equipSkin,
      updateStats,
      claimDailyReward,
      useDailySpin,
      resetDailyProgress,
      unlockAchievement,
      initializeUserData,
      clearUserData,
    }),
    [
      userData,
      powerLevel,
      addCoins,
      spendCoins,
      addGems,
      spendGems,
      addUsdt,
      spendUsdt,
      purchaseUpgrade,
      canAffordUpgrade,
      getUpgradeCost,
      purchaseSkin,
      equipSkin,
      updateStats,
      claimDailyReward,
      useDailySpin,
      resetDailyProgress,
      unlockAchievement,
      initializeUserData,
      clearUserData,
    ]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
