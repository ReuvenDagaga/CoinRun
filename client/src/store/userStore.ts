import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserUpgrades, UserStats, DailyMission, Achievement } from '@shared/types/game.types';
import { calculatePowerLevel, calculateUpgradeCost, GAME_CONSTANTS } from '@shared/types/game.types';

interface User {
  id: string;
  username: string;
  email?: string;

  // Balances
  usdtBalance: number;
  coins: number;
  gems: number;

  // Customization
  currentSkin: string;
  ownedSkins: string[];

  // Upgrades
  upgrades: UserUpgrades;

  // Stats
  stats: UserStats;

  // Daily
  dailyMissionsCompleted: string[];
  lastDailyReward: string | null;
  spinUsedToday: boolean;
  dailyStreak: number;

  // Achievements
  achievements: Achievement[];
}

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Computed
  powerLevel: number;

  // Auth actions
  login: (userData: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;

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
}

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

const defaultUser: User = {
  id: '',
  username: 'Guest',
  usdtBalance: 0,
  coins: 1000, // Starting coins
  gems: 50, // Starting gems
  currentSkin: 'default',
  ownedSkins: ['default'],
  upgrades: defaultUpgrades,
  stats: defaultStats,
  dailyMissionsCompleted: [],
  lastDailyReward: null,
  spinUsedToday: false,
  dailyStreak: 0,
  achievements: []
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      powerLevel: 0,

      login: (userData) => {
        const powerLevel = calculatePowerLevel(userData.upgrades);
        set({
          user: userData,
          isAuthenticated: true,
          powerLevel
        });
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          powerLevel: 0
        });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      addCoins: (amount) => {
        const { user } = get();
        if (!user) return;
        set({
          user: { ...user, coins: user.coins + amount }
        });
      },

      spendCoins: (amount) => {
        const { user } = get();
        if (!user || user.coins < amount) return false;
        set({
          user: { ...user, coins: user.coins - amount }
        });
        return true;
      },

      addGems: (amount) => {
        const { user } = get();
        if (!user) return;
        set({
          user: { ...user, gems: user.gems + amount }
        });
      },

      spendGems: (amount) => {
        const { user } = get();
        if (!user || user.gems < amount) return false;
        set({
          user: { ...user, gems: user.gems - amount }
        });
        return true;
      },

      addUsdt: (amount) => {
        const { user } = get();
        if (!user) return;
        set({
          user: { ...user, usdtBalance: user.usdtBalance + amount }
        });
      },

      spendUsdt: (amount) => {
        const { user } = get();
        if (!user || user.usdtBalance < amount) return false;
        set({
          user: { ...user, usdtBalance: user.usdtBalance - amount }
        });
        return true;
      },

      purchaseUpgrade: (type) => {
        const { user, canAffordUpgrade, getUpgradeCost, spendCoins } = get();
        if (!user) return false;

        const maxLevel = GAME_CONSTANTS.MAX_LEVELS[type];
        if (user.upgrades[type] >= maxLevel) return false;

        if (!canAffordUpgrade(type)) return false;

        const cost = getUpgradeCost(type);
        if (!spendCoins(cost)) return false;

        const newUpgrades = {
          ...user.upgrades,
          [type]: user.upgrades[type] + 1
        };

        const newPowerLevel = calculatePowerLevel(newUpgrades);

        set({
          user: { ...user, upgrades: newUpgrades },
          powerLevel: newPowerLevel
        });

        return true;
      },

      canAffordUpgrade: (type) => {
        const { user, getUpgradeCost } = get();
        if (!user) return false;
        const cost = getUpgradeCost(type);
        return user.coins >= cost;
      },

      getUpgradeCost: (type) => {
        const { user } = get();
        if (!user) return 0;
        return calculateUpgradeCost(type, user.upgrades[type]);
      },

      purchaseSkin: (skinId, price) => {
        const { user, spendCoins, spendGems } = get();
        if (!user) return false;
        if (user.ownedSkins.includes(skinId)) return false;

        if (price.gems && price.gems > 0) {
          if (!spendGems(price.gems)) return false;
        } else if (price.coins && price.coins > 0) {
          if (!spendCoins(price.coins)) return false;
        }

        set({
          user: {
            ...user,
            ownedSkins: [...user.ownedSkins, skinId]
          }
        });

        return true;
      },

      equipSkin: (skinId) => {
        const { user } = get();
        if (!user) return;
        if (!user.ownedSkins.includes(skinId)) return;

        set({
          user: { ...user, currentSkin: skinId }
        });
      },

      updateStats: (gameResult) => {
        const { user } = get();
        if (!user) return;

        set({
          user: {
            ...user,
            stats: {
              gamesPlayed: user.stats.gamesPlayed + 1,
              gamesWon: user.stats.gamesWon + (gameResult.won ? 1 : 0),
              totalDistance: user.stats.totalDistance + gameResult.distanceTraveled,
              totalCoinsCollected: user.stats.totalCoinsCollected + gameResult.coinsCollected,
              highestArmy: Math.max(user.stats.highestArmy, gameResult.armySize)
            }
          }
        });
      },

      claimDailyReward: () => {
        const { user } = get();
        if (!user) return null;

        const today = new Date().toDateString();
        if (user.lastDailyReward === today) return null;

        // Calculate streak
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const isConsecutive = user.lastDailyReward === yesterday.toDateString();
        const newStreak = isConsecutive ? Math.min(user.dailyStreak + 1, 7) : 1;

        // Daily rewards based on streak
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

        set({
          user: {
            ...user,
            coins: user.coins + reward.coins,
            gems: user.gems + (reward.gems || 0),
            lastDailyReward: today,
            dailyStreak: newStreak
          }
        });

        return reward;
      },

      useDailySpin: () => {
        const { user } = get();
        if (!user || user.spinUsedToday) return false;

        set({
          user: { ...user, spinUsedToday: true }
        });

        return true;
      },

      resetDailyProgress: () => {
        const { user } = get();
        if (!user) return;

        set({
          user: {
            ...user,
            dailyMissionsCompleted: [],
            spinUsedToday: false
          }
        });
      },

      unlockAchievement: (achievementId) => {
        const { user } = get();
        if (!user) return;
        if (user.achievements.some(a => a.id === achievementId)) return;

        set({
          user: {
            ...user,
            achievements: [
              ...user.achievements,
              { id: achievementId, name: '', description: '', reward: {}, unlockedAt: new Date() }
            ]
          }
        });
      }
    }),
    {
      name: 'coinrun-user-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        powerLevel: state.powerLevel
      })
    }
  )
);

// Initialize guest user if not authenticated
export function initializeGuestUser() {
  const { user, login } = useUserStore.getState();
  if (!user) {
    login({
      ...defaultUser,
      id: 'guest-' + Date.now()
    });
  }
}
