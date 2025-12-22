import { ChestTier, IChestConfig } from '@shared/interface/IChest.js';

// Chest configuration
export const CHEST_CONFIG: Record<ChestTier, IChestConfig> = {
  bronze: {
    tier: 'bronze',
    cardCount: { min: 1, max: 2 },
    coinRange: { min: 100, max: 500 },
    gemRange: { min: 0, max: 5 },
    dropRates: {
      uncommon: 0.45,    // 45%
      common: 0.35,      // 35%
      rare: 0.15,        // 15%
      epic: 0.04,        // 4%
      legendary: 0.01    // 1%
    },
    gemCost: 50
  },
  silver: {
    tier: 'silver',
    cardCount: { min: 2, max: 3 },
    coinRange: { min: 300, max: 1000 },
    gemRange: { min: 5, max: 15 },
    dropRates: {
      uncommon: 0.25,    // 25%
      common: 0.40,      // 40%
      rare: 0.25,        // 25%
      epic: 0.08,        // 8%
      legendary: 0.02    // 2%
    },
    gemCost: 150
  },
  gold: {
    tier: 'gold',
    cardCount: { min: 3, max: 5 },
    coinRange: { min: 500, max: 2000 },
    gemRange: { min: 10, max: 30 },
    dropRates: {
      uncommon: 0.10,    // 10%
      common: 0.30,      // 30%
      rare: 0.35,        // 35%
      epic: 0.18,        // 18%
      legendary: 0.07    // 7%
    },
    gemCost: 300
  }
};

// Timed chest configuration
export const TIMED_CHEST_CONFIG = {
  INTERVAL_SECONDS: 90,  // 90 seconds between chests

  // Weight for random chest tier selection
  TIER_WEIGHTS: {
    bronze: 0.60,    // 60%
    silver: 0.30,    // 30%
    gold: 0.10       // 10%
  } as Record<ChestTier, number>,

  // Pity system - guaranteed legendary after X chests without one
  PITY_THRESHOLDS: {
    bronze: 100,
    silver: 50,
    gold: 25
  } as Record<ChestTier, number>
};

// Drop rate disclosure (for legal compliance and transparency)
export const DROP_RATE_DISCLOSURE: Record<ChestTier, string> = {
  bronze: 'Bronze Chest: Uncommon 45%, Common 35%, Rare 15%, Epic 4%, Legendary 1%',
  silver: 'Silver Chest: Uncommon 25%, Common 40%, Rare 25%, Epic 8%, Legendary 2%',
  gold: 'Gold Chest: Uncommon 10%, Common 30%, Rare 35%, Epic 18%, Legendary 7%'
};

// Helper function to get random number in range
export const getRandomInRange = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Get chest config by tier
export const getChestConfig = (tier: ChestTier): IChestConfig => {
  return CHEST_CONFIG[tier];
};
