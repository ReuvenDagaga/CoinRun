import { useContext, useCallback } from 'react';
import { AuthContext } from '@/context/AuthContext';

interface UseUpdatesReturn {
  // Coins
  addCoins: (amount: number) => Promise<void>;
  spendCoins: (amount: number) => Promise<boolean>;

  // Gems
  addGems: (amount: number) => Promise<void>;
  spendGems: (amount: number) => Promise<boolean>;

  // Skins
  purchaseSkin: (skinId: string, price: { coins?: number; gems?: number }) => Promise<boolean>;
  equipSkin: (skinId: string) => Promise<void>;

  // Stats
  updateStats: (gameResult: { coinsCollected: number; distanceTraveled: number; won: boolean; armySize: number }) => Promise<void>;

  // Achievements
  unlockAchievement: (achievementId: string) => Promise<void>;
}

export function useUpdates(): UseUpdatesReturn {
  const auth = useContext(AuthContext);

  if (!auth) {
    throw new Error('useUpdates must be used within an AuthProvider');
  }

  const { user, updateUser } = auth;

  // Coins
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

  // Gems
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

  // Skins
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

  // Stats
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

  // Achievements
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

  return {
    addCoins,
    spendCoins,
    addGems,
    spendGems,
    purchaseSkin,
    equipSkin,
    updateStats,
    unlockAchievement,
  };
}

export default useUpdates;
