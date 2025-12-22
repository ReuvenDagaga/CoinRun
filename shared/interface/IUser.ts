import { IAchievement } from "./IAchievement";
import { IActiveBoost } from "./IActiveBoost";
import { IMission } from "./IMission";
import { ISettings } from "./ISettings";
import { IUpgrades } from "./IUpgrades";
import { IUserCard } from "./IUserCard";
import { ITimedChest, IPityCounter } from "./IChest";
import mongoose, { Document } from 'mongoose';




export interface IUser extends Document {
  // Basic Info (Google OAuth required)
  username: string;
  email: string;
  googleId: string;
  avatar?: string;

  // Balances (VIRTUAL CURRENCIES ONLY - NO CRYPTO)
  coins: number;
  gems: number;
  heldCoins: number; // Coins held during matchmaking

  // Stats
  gamesPlayed: number;
  gamesWon: number;
  totalDistance: number;
  totalCoinsCollected: number;
  highestArmy: number;
  bestScore: number;

  // Upgrades (INFINITE LEVELS - no max)
  upgrades: IUpgrades;

  // Missions
  dailyMissions: IMission[];
  weeklyMissions: IMission[];
  lastDailyReset?: Date;
  lastWeeklyReset?: Date;

  // Achievements
  achievements: IAchievement[];

  // Shop & Customization
  currentSkin: string;
  ownedSkins: string[];
  activeBoosts: IActiveBoost[];

  // Asset System (NEW)
  currentCharacterType: 'preset' | 'custom';
  currentCustomCharacterId?: string;
  creatorStats?: {
    totalAssetsSold: number;
    totalEarnings: { coins: number; gems: number };
    creatorRating: number;
    ratingCount: number;
  };

  // Settings
  settings: ISettings;

  // Card System
  cards: IUserCard[];
  timedChest?: ITimedChest;
  lastChestTime?: Date;
  pityCounter: IPityCounter;
  totalChestsOpened: number;

  // Social (Future feature)
  friends: mongoose.Types.ObjectId[];
  referralCode: string;
  referredBy?: string;

  createdAt: Date;
  updatedAt: Date;

  // Virtual field - computed from upgrades + cards
  powerLevel: number;

  // Methods
  getPowerLevel(): number;
}

export interface IUserData {
  // Basic Info (Google OAuth required)
  username: string;
  email: string;
  googleId: string;
  avatar?: string;

  // Balances (VIRTUAL CURRENCIES ONLY - NO CRYPTO)
  coins: number;
  gems: number;
  heldCoins: number; // Coins held during matchmaking

  // Stats
  gamesPlayed: number;
  gamesWon: number;
  totalDistance: number;
  totalCoinsCollected: number;
  highestArmy: number;
  bestScore: number;

  // Upgrades (INFINITE LEVELS - no max)
  upgrades: IUpgrades;

  // Missions
  dailyMissions: IMission[];
  weeklyMissions: IMission[];
  lastDailyReset?: Date;
  lastWeeklyReset?: Date;

  // Achievements
  achievements: IAchievement[];

  // Shop & Customization
  currentSkin: string;
  ownedSkins: string[];
  activeBoosts: IActiveBoost[];

  // Asset System (NEW)
  currentCharacterType: 'preset' | 'custom';
  currentCustomCharacterId?: string;
  creatorStats?: {
    totalAssetsSold: number;
    totalEarnings: { coins: number; gems: number };
    creatorRating: number;
    ratingCount: number;
  };

  // Settings
  settings: ISettings;

  // Card System
  cards: IUserCard[];
  timedChest?: ITimedChest;
  lastChestTime?: Date;
  pityCounter: IPityCounter;
  totalChestsOpened: number;

  // Social (Future feature)
  friends: mongoose.Types.ObjectId[];
  referralCode: string;
  referredBy?: string;

  createdAt: Date;
  updatedAt: Date;

  // Virtual field - computed from upgrades + cards
  powerLevel: number;

  // Methods
  getPowerLevel(): number;
}