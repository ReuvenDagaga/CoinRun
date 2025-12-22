import { CardRarity } from './ICard';

// Chest tier types
export type ChestTier = 'bronze' | 'silver' | 'gold';

// Drop rate configuration for each rarity
export interface IChestDropRate {
  uncommon: number;
  common: number;
  rare: number;
  epic: number;
  legendary: number;
}

// Chest configuration
export interface IChestConfig {
  tier: ChestTier;
  cardCount: { min: number; max: number };
  coinRange: { min: number; max: number };
  gemRange: { min: number; max: number };
  dropRates: IChestDropRate;
  gemCost: number;  // Cost to purchase directly
}

// Reward from opening a chest
export interface IChestReward {
  cards: Array<{
    cardId: string;
    rarity: CardRarity;
    isDuplicate: boolean;
    conversionReward?: { coins: number; gems: number };
  }>;
  coins: number;
  gems: number;
}

// User's pending timed chest
export interface ITimedChest {
  tier: ChestTier;
  availableAt: Date;
  claimed: boolean;
}

// Pity counter for each chest tier
export interface IPityCounter {
  bronze: number;
  silver: number;
  gold: number;
}

// Chest tier colors for UI
export const CHEST_TIER_COLORS: Record<ChestTier, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700'
};

// Timed chest interval in seconds
export const TIMED_CHEST_INTERVAL_SECONDS = 90;

// Timed chest tier weights
export const TIMED_CHEST_TIER_WEIGHTS: Record<ChestTier, number> = {
  bronze: 0.60,  // 60%
  silver: 0.30,  // 30%
  gold: 0.10     // 10%
};
