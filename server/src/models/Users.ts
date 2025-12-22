import mongoose, { Schema } from "mongoose";
import { IUpgrades } from "../../../shared/interface/IUpgrades";
import { IMission } from "@shared/interface/IMission";
import { ISettings } from "@shared/interface/ISettings";
import { IActiveBoost } from "@shared/interface/IActiveBoost";
import { IAchievement } from "@shared/interface/IAchievement";
import { IUser } from "@shared/interface/IUser";
import { IUserCard } from "@shared/interface/IUserCard";
import { ITimedChest, IPityCounter } from "@shared/interface/IChest";
import { POWER_PER_STAR } from "../config/card.config.js";



// INFINITE LEVELS - No max level restrictions!
const upgradesSchema = new Schema<IUpgrades>({
  capacity: { type: Number, default: 0, min: 0 },
  addWarrior: { type: Number, default: 0, min: 0 },
  warriorUpgrade: { type: Number, default: 0, min: 0 },
  income: { type: Number, default: 0, min: 0 },
  speed: { type: Number, default: 0, min: 0 },
  jump: { type: Number, default: 0, min: 0 },
  power: { type: Number, default: 0, min: 0 },
  magnet: { type: Number, default: 0, min: 0 }
}, { _id: false });

const missionSchema = new Schema<IMission>({
  missionId: { type: String, required: true },
  progress: { type: Number, default: 0, min: 0 },
  completed: { type: Boolean, default: false },
  claimed: { type: Boolean, default: false }
}, { _id: false });

const settingsSchema = new Schema<ISettings>({
  masterVolume: { type: Number, default: 0.7, min: 0, max: 1 },
  musicVolume: { type: Number, default: 0.5, min: 0, max: 1 },
  sfxVolume: { type: Number, default: 0.8, min: 0, max: 1 },
  graphicsQuality: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  showFPS: { type: Boolean, default: true },
  controlSensitivity: { type: Number, default: 0.6, min: 0, max: 1 }
}, { _id: false });

const activeBoostSchema = new Schema<IActiveBoost>({
  boostId: { type: String, required: true },
  expiresAt: { type: Date, required: true }
}, { _id: false });

const achievementSchema = new Schema<IAchievement>({
  achievementId: { type: String, required: true },
  progress: { type: Number, default: 0, min: 0 },
  unlocked: { type: Boolean, default: false },
  unlockedAt: { type: Date }
}, { _id: false });

// Card System Schemas
const userCardSchema = new Schema<IUserCard>({
  cardId: { type: String, required: true },
  starLevel: { type: Number, default: 0, min: 0, max: 3 },
  acquiredAt: { type: Date, default: Date.now },
  duplicatesConverted: { type: Number, default: 0, min: 0 }
}, { _id: false });

const timedChestSchema = new Schema<ITimedChest>({
  tier: { type: String, enum: ['bronze', 'silver', 'gold'], required: true },
  availableAt: { type: Date, required: true },
  claimed: { type: Boolean, default: false }
}, { _id: false });

const pityCounterSchema = new Schema<IPityCounter>({
  bronze: { type: Number, default: 0, min: 0 },
  silver: { type: Number, default: 0, min: 0 },
  gold: { type: Number, default: 0, min: 0 }
}, { _id: false });

const userSchema = new Schema<IUser>({
  // Basic Info - Google OAuth REQUIRED
  username: { type: String, required: true, trim: true, minlength: 3, maxlength: 20 },
  email: { type: String, required: true, lowercase: true, trim: true },
  googleId: { type: String, required: true },
  avatar: { type: String },

  // Balances - VIRTUAL ONLY (NO CRYPTO!)
  coins: { type: Number, default: 1000, min: 0 },
  gems: { type: Number, default: 50, min: 0 },
  heldCoins: { type: Number, default: 0, min: 0 }, // Coins held during matchmaking

  // Stats
  gamesPlayed: { type: Number, default: 0, min: 0 },
  gamesWon: { type: Number, default: 0, min: 0 },
  totalDistance: { type: Number, default: 0, min: 0 },
  totalCoinsCollected: { type: Number, default: 0, min: 0 },
  highestArmy: { type: Number, default: 0, min: 0 },
  bestScore: { type: Number, default: 0, min: 0 },

  // Upgrades - INFINITE LEVELS
  upgrades: { type: upgradesSchema, default: () => ({}) },

  // Missions
  dailyMissions: { type: [missionSchema], default: [] },
  weeklyMissions: { type: [missionSchema], default: [] },
  lastDailyReset: { type: Date },
  lastWeeklyReset: { type: Date },

  // Achievements
  achievements: { type: [achievementSchema], default: [] },

  // Shop & Customization
  currentSkin: { type: String, default: 'default' },
  ownedSkins: { type: [String], default: ['default'] },
  activeBoosts: { type: [activeBoostSchema], default: [] },

  // Asset System (NEW)
  currentCharacterType: { type: String, enum: ['preset', 'custom'], default: 'preset' },
  currentCustomCharacterId: { type: String },
  creatorStats: {
    totalAssetsSold: { type: Number, default: 0, min: 0 },
    totalEarnings: {
      coins: { type: Number, default: 0, min: 0 },
      gems: { type: Number, default: 0, min: 0 }
    },
    creatorRating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 }
  },

  // Settings
  settings: { type: settingsSchema, default: () => ({}) },

  // Card System
  cards: { type: [userCardSchema], default: [] },
  timedChest: { type: timedChestSchema },
  lastChestTime: { type: Date },
  pityCounter: { type: pityCounterSchema, default: () => ({ bronze: 0, silver: 0, gold: 0 }) },
  totalChestsOpened: { type: Number, default: 0, min: 0 },

  // Social (Future)
  friends: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  referralCode: { type: String },
  referredBy: { type: String }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Generate referral code before save
userSchema.pre('save', function(next) {
  if (!this.referralCode) {
    this.referralCode = this.username.toLowerCase() + Math.random().toString(36).substring(2, 6);
  }
  next();
});

// Virtual field for power level - included in JSON responses
userSchema.virtual('powerLevel').get(function() {
  const u = this.upgrades;
  const baseLevel = (
    u.capacity * 10 +
    u.addWarrior * 20 +
    u.warriorUpgrade * 10 +
    u.income * 5 +
    u.speed * 8 +
    u.jump * 6 +
    u.power * 12 +
    u.magnet * 5
  );

  // Add card contribution: each star level contributes to power
  const cardPower = this.cards.reduce((total: number, card: IUserCard) => {
    return total + (card.starLevel + 1) * POWER_PER_STAR;
  }, 0);

  return baseLevel + cardPower;
});

// Method version for backwards compatibility
userSchema.methods.getPowerLevel = function(): number {
  return this.powerLevel;
};

// Indexes - defined ONCE here to avoid duplicate warnings
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ googleId: 1 }, { unique: true });
userSchema.index({ referralCode: 1 }, { unique: true, sparse: true });

export const User = mongoose.model<IUser>('User', userSchema);
