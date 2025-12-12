import { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback } from 'react';
import type { FullUserResponse, Mission, ActiveBoost, UserAchievement, UserSettings } from '@shared/types/user.types';
import type { UserUpgrades, UserStats } from '@shared/types/game.types';
import { calculatePowerLevel, calculateUpgradeCost, GAME_CONSTANTS } from '@shared/types/game.types';
import { useAuth } from './AuthContext';

/**
 * SINGLE SOURCE OF TRUTH - User Data Type
 *
 * This interface matches FullUserResponse from the backend exactly.
 * DO NOT add fields that aren't in the backend response.
 * DO NOT create alternative user data structures.
 */
type UserData = FullUserResponse;

interface UserContextValue {
  userData: UserData | null;
  powerLevel: number;

  // Balance actions
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  addGems: (amount: number) => void;
  spendGems: (amount: number) => boolean;

  // Upgrade actions
  purchaseUpgrade: (type: keyof UserUpgrades) => boolean;
  canAffordUpgrade: (type: keyof UserUpgrades) => boolean;
  getUpgradeCost: (type: keyof UserUpgrades) => number;

  // Skin actions
  purchaseSkin: (skinId: string, price: { coins?: number; gems?: number }) => boolean;
  equipSkin: (skinId: string) => void;

  // Stats actions
  updateStats: (gameResult: { coinsCollected: number; distanceTraveled: number; won: boolean; armySize: number; score: number }) => void;

  // Mission actions
  updateMissionProgress: (missionId: string, progress: number) => void;
  claimMission: (missionId: string, reward: { coins?: number; gems?: number }) => void;

  // Achievement actions
  unlockAchievement: (achievementId: string, progress: number) => void;

  // Initialize user data
  initializeUserData: (data: UserData) => void;
  clearUserData: () => void;
  refreshUserData: () => Promise<void>;
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
  highestArmy: 0,
  bestScore: 0
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

  // REMOVED: addUsdt and spendUsdt functions
  // USDT is not part of the user model - all balances are virtual (coins/gems only)

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

  const updateStats = useCallback((gameResult: { coinsCollected: number; distanceTraveled: number; won: boolean; armySize: number; score: number }) => {
    setUserData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        stats: {
          gamesPlayed: prev.stats.gamesPlayed + 1,
          gamesWon: prev.stats.gamesWon + (gameResult.won ? 1 : 0),
          totalDistance: prev.stats.totalDistance + gameResult.distanceTraveled,
          totalCoinsCollected: prev.stats.totalCoinsCollected + gameResult.coinsCollected,
          highestArmy: Math.max(prev.stats.highestArmy, gameResult.armySize),
          bestScore: Math.max(prev.stats.bestScore, gameResult.score)
        }
      };
    });
  }, []);

  // REMOVED: claimDailyReward, useDailySpin, resetDailyProgress
  // These were client-side only functions not backed by the server
  // Daily missions are now handled by the backend mission system

  const updateMissionProgress = useCallback((missionId: string, progress: number) => {
    setUserData(prev => {
      if (!prev) return prev;

      const updatedDaily = prev.dailyMissions.map(m =>
        m.missionId === missionId ? { ...m, progress, completed: progress >= 100 } : m
      );
      const updatedWeekly = prev.weeklyMissions.map(m =>
        m.missionId === missionId ? { ...m, progress, completed: progress >= 100 } : m
      );

      return {
        ...prev,
        dailyMissions: updatedDaily,
        weeklyMissions: updatedWeekly
      };
    });
  }, []);

  const claimMission = useCallback((missionId: string, reward: { coins?: number; gems?: number }) => {
    setUserData(prev => {
      if (!prev) return prev;

      const updatedDaily = prev.dailyMissions.map(m =>
        m.missionId === missionId ? { ...m, claimed: true } : m
      );
      const updatedWeekly = prev.weeklyMissions.map(m =>
        m.missionId === missionId ? { ...m, claimed: true } : m
      );

      return {
        ...prev,
        coins: prev.coins + (reward.coins || 0),
        gems: prev.gems + (reward.gems || 0),
        dailyMissions: updatedDaily,
        weeklyMissions: updatedWeekly
      };
    });
  }, []);

  const unlockAchievement = useCallback((achievementId: string, progress: number) => {
    setUserData(prev => {
      if (!prev) return prev;

      const existingIndex = prev.achievements.findIndex(a => a.achievementId === achievementId);

      if (existingIndex >= 0) {
        // Update existing achievement
        const updated = [...prev.achievements];
        updated[existingIndex] = {
          ...updated[existingIndex],
          progress,
          unlocked: progress >= 100,
          unlockedAt: progress >= 100 ? new Date().toISOString() : updated[existingIndex].unlockedAt
        };
        return { ...prev, achievements: updated };
      } else {
        // Add new achievement
        return {
          ...prev,
          achievements: [
            ...prev.achievements,
            {
              achievementId,
              progress,
              unlocked: progress >= 100,
              unlockedAt: progress >= 100 ? new Date().toISOString() : undefined
            }
          ]
        };
      }
    });
  }, []);

  const refreshUserData = useCallback(async () => {
    // TODO: Implement API call to refresh user data from server
    // This should call /api/auth/me and update local state
    console.warn('refreshUserData not implemented yet');
  }, []);

  const value = useMemo(
    () => ({
      userData,
      powerLevel,
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
      updateMissionProgress,
      claimMission,
      unlockAchievement,
      initializeUserData,
      clearUserData,
      refreshUserData,
    }),
    [
      userData,
      powerLevel,
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
      updateMissionProgress,
      claimMission,
      unlockAchievement,
      initializeUserData,
      clearUserData,
      refreshUserData,
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
