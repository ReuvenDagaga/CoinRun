import { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback } from 'react';
import { calculatePowerLevel, calculateUpgradeCost, GAME_CONSTANTS } from '@shared/types/game.types';
import { useAuth } from '@/hooks/useAuth';
import { IUpgrades } from '@shared/interface/IUpgrades';
import { IUserData } from '@shared/interface/IUser';

interface UserContextValue {
  userData: IUserData | null;
  powerLevel: number;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  addGems: (amount: number) => void;
  spendGems: (amount: number) => boolean;
  purchaseUpgrade: (type: keyof IUpgrades) => boolean;
  canAffordUpgrade: (type: keyof IUpgrades) => boolean;
  getUpgradeCost: (type: keyof IUpgrades) => number;
  purchaseSkin: (skinId: string, price: { coins?: number; gems?: number }) => boolean;
  equipSkin: (skinId: string) => void;
  updateStats: (gameResult: { coinsCollected: number; distanceTraveled: number; won: boolean; armySize: number }) => void;
  unlockAchievement: (achievementId: string) => void;
  initializeUserData: (data: IUserData) => void;
  clearUserData: () => void;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { user: authUser } = useAuth();
  const [userData, setUserData] = useState<IUserData | null>(null);
  const [powerLevel, setPowerLevel] = useState(0);

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

  useEffect(() => {
    if (!authUser && userData) {
      setUserData(null);
      setPowerLevel(0);
      localStorage.removeItem('coinrun-user-data');
    }
  }, [authUser, userData]);

  useEffect(() => {
    if (userData) {
      localStorage.setItem('coinrun-user-data', JSON.stringify({ userData, powerLevel }));
    }
  }, [userData, powerLevel]);

  const initializeUserData = useCallback((data: IUserData) => {
    setUserData(data);
    setPowerLevel(calculatePowerLevel(data.upgrades));
  }, []);

  const clearUserData = useCallback(() => {
    setUserData(null);
    setPowerLevel(0);
    localStorage.removeItem('coinrun-user-data');
  }, []);

  const addCoins = useCallback((amount: number) => {
    setUserData(prev => prev ? { ...prev, coins: prev.coins + amount } : prev);
  }, []);

  const spendCoins = useCallback((amount: number): boolean => {
    let success = false;
    setUserData(prev => {
      if (!prev || prev.coins < amount) return prev;
      success = true;
      return { ...prev, coins: prev.coins - amount };
    });
    return success;
  }, []);

  const addGems = useCallback((amount: number) => {
    setUserData(prev => prev ? { ...prev, gems: prev.gems + amount } : prev);
  }, []);

  const spendGems = useCallback((amount: number): boolean => {
    let success = false;
    setUserData(prev => {
      if (!prev || prev.gems < amount) return prev;
      success = true;
      return { ...prev, gems: prev.gems - amount };
    });
    return success;
  }, []);

  const getUpgradeCost = useCallback((type: keyof IUpgrades): number => {
    if (!userData) return 0;
    return calculateUpgradeCost(type, userData.upgrades[type]);
  }, [userData]);

  const canAffordUpgrade = useCallback((type: keyof IUpgrades): boolean => {
    if (!userData) return false;
    return userData.coins >= getUpgradeCost(type);
  }, [userData, getUpgradeCost]);

  const purchaseUpgrade = useCallback((type: keyof IUpgrades): boolean => {
    if (!userData || !canAffordUpgrade(type)) return false;

    const maxLevel = GAME_CONSTANTS.MAX_LEVELS[type];
    if (userData.upgrades[type] >= maxLevel) return false;

    const cost = getUpgradeCost(type);
    const newUpgrades = { ...userData.upgrades, [type]: userData.upgrades[type] + 1 };

    setUserData({ ...userData, coins: userData.coins - cost, upgrades: newUpgrades });
    setPowerLevel(calculatePowerLevel(newUpgrades));
    return true;
  }, [userData, canAffordUpgrade, getUpgradeCost]);

  const purchaseSkin = useCallback((skinId: string, price: { coins?: number; gems?: number }): boolean => {
    if (!userData || userData.ownedSkins.includes(skinId)) return false;

    if (price.gems && price.gems > 0) {
      if (userData.gems < price.gems) return false;
      setUserData({ ...userData, gems: userData.gems - price.gems, ownedSkins: [...userData.ownedSkins, skinId] });
      return true;
    }
    
    if (price.coins && price.coins > 0) {
      if (userData.coins < price.coins) return false;
      setUserData({ ...userData, coins: userData.coins - price.coins, ownedSkins: [...userData.ownedSkins, skinId] });
      return true;
    }

    return false;
  }, [userData]);

  const equipSkin = useCallback((skinId: string) => {
    if (!userData || !userData.ownedSkins.includes(skinId)) return;
    setUserData({ ...userData, currentSkin: skinId });
  }, [userData]);

  const updateStats = useCallback((gameResult: { coinsCollected: number; distanceTraveled: number; won: boolean; armySize: number }) => {
    setUserData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        gamesPlayed: prev.gamesPlayed + 1,
        gamesWon: prev.gamesWon + (gameResult.won ? 1 : 0),
        totalDistance: prev.totalDistance + gameResult.distanceTraveled,
        totalCoinsCollected: prev.totalCoinsCollected + gameResult.coinsCollected,
        highestArmy: Math.max(prev.highestArmy, gameResult.armySize)
      };
    });
  }, []);

  const unlockAchievement = useCallback((achievementId: string) => {
    setUserData(prev => {
      if (!prev || prev.achievements.some(a => a.achievementId === achievementId)) return prev;
      return {
        ...prev,
        achievements: [...prev.achievements, { achievementId, progress: 100, unlocked: true, unlockedAt: new Date() }]
      };
    });
  }, []);

  const value = useMemo(() => ({
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
    unlockAchievement,
    initializeUserData,
    clearUserData,
  }), [userData, powerLevel, addCoins, spendCoins, addGems, spendGems, purchaseUpgrade, canAffordUpgrade, getUpgradeCost, purchaseSkin, equipSkin, updateStats, unlockAchievement, initializeUserData, clearUserData]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}