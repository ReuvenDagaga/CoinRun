import mongoose, { Schema, Document } from 'mongoose';

export interface IUpgrades {
  capacity: number;        // Army capacity (infinite levels)
  addWarrior: number;      // Starting army size (infinite levels)
  warriorUpgrade: number;  // Warrior power (infinite levels)
  income: number;          // Coin value multiplier (infinite levels)
  speed: number;           // Movement speed (infinite levels)
  jump: number;            // Jump height (infinite levels)
  bulletPower: number;     // Bullet damage (infinite levels)
  magnetRadius: number;    // Coin magnet radius (infinite levels)
}

export interface IMission {
  missionId: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

export interface ISettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  graphicsQuality: 'low' | 'medium' | 'high';
  showFPS: boolean;
  controlSensitivity: number;
}

export interface IActiveBoost {
  boostId: string;
  expiresAt: Date;
}

export interface IAchievement {
  achievementId: string;
  progress: number;
  unlocked: boolean;
  unlockedAt?: Date;
}

export interface IUser extends Document {
  // Basic Info (Google OAuth required)
  username: string;
  email: string;
  googleId: string;
  avatar?: string;

  // Balances (VIRTUAL CURRENCIES ONLY - NO CRYPTO)
  coins: number;
  gems: number;

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

  // Settings
  settings: ISettings;

  // Social (Future feature)
  friends: mongoose.Types.ObjectId[];
  referralCode: string;
  referredBy?: string;

  createdAt: Date;
  updatedAt: Date;

  // Methods
  getPowerLevel(): number;
}

// INFINITE LEVELS - No max level restrictions!
const upgradesSchema = new Schema<IUpgrades>({
  capacity: { type: Number, default: 0, min: 0 },
  addWarrior: { type: Number, default: 0, min: 0 },
  warriorUpgrade: { type: Number, default: 0, min: 0 },
  income: { type: Number, default: 0, min: 0 },
  speed: { type: Number, default: 0, min: 0 },
  jump: { type: Number, default: 0, min: 0 },
  bulletPower: { type: Number, default: 0, min: 0 },
  magnetRadius: { type: Number, default: 0, min: 0 }
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

const userSchema = new Schema<IUser>({
  // Basic Info - Google OAuth REQUIRED
  username: { type: String, required: true, trim: true, minlength: 3, maxlength: 20 },
  email: { type: String, required: true, lowercase: true, trim: true },
  googleId: { type: String, required: true },
  avatar: { type: String },

  // Balances - VIRTUAL ONLY (NO CRYPTO!)
  coins: { type: Number, default: 1000, min: 0 },
  gems: { type: Number, default: 50, min: 0 },

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

  // Settings
  settings: { type: settingsSchema, default: () => ({}) },

  // Social (Future)
  friends: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  referralCode: { type: String },
  referredBy: { type: String }
}, {
  timestamps: true
});

// Generate referral code before save
userSchema.pre('save', function(next) {
  if (!this.referralCode) {
    this.referralCode = this.username.toLowerCase() + Math.random().toString(36).substring(2, 6);
  }
  next();
});

// Calculate power level
userSchema.methods.getPowerLevel = function(): number {
  const u = this.upgrades;
  return (
    u.capacity * 10 +
    u.addWarrior * 20 +
    u.warriorUpgrade * 10 +
    u.income * 5 +
    u.speed * 8 +
    u.jump * 6 +
    u.bulletPower * 12 +
    u.magnetRadius * 5
  );
};

// Indexes - defined ONCE here to avoid duplicate warnings
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ googleId: 1 }, { unique: true });
userSchema.index({ referralCode: 1 }, { unique: true, sparse: true });

export const User = mongoose.model<IUser>('User', userSchema);
