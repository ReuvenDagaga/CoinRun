import mongoose, { Schema, Document } from 'mongoose';

export interface IUpgrades {
  capacity: number;
  addWarrior: number;
  warriorUpgrade: number;
  income: number;
  speed: number;
  jump: number;
  bulletPower: number;
  magnetRadius: number;
}

export interface IAchievement {
  achievementId: string;
  unlockedAt: Date;
}

export interface IUser extends Document {
  username: string;
  email?: string;
  googleId?: string;
  passwordHash?: string;

  // Balances
  usdtBalance: number;
  coins: number;
  gems: number;

  // Stats
  gamesPlayed: number;
  gamesWon: number;
  totalDistance: number;
  totalCoinsCollected: number;
  highestArmy: number;

  // Upgrades
  upgrades: IUpgrades;

  // Customization
  currentSkin: string;
  ownedSkins: string[];

  // Social
  friends: mongoose.Types.ObjectId[];
  referralCode: string;
  referredBy?: string;

  // Daily
  dailyMissionsCompleted: string[];
  lastDailyReward?: Date;
  spinUsedToday: boolean;
  dailyStreak: number;

  // Achievements
  achievements: IAchievement[];

  createdAt: Date;
  updatedAt: Date;
}

const upgradesSchema = new Schema<IUpgrades>({
  capacity: { type: Number, default: 0, min: 0, max: 20 },
  addWarrior: { type: Number, default: 0, min: 0, max: 10 },
  warriorUpgrade: { type: Number, default: 0, min: 0, max: 20 },
  income: { type: Number, default: 0, min: 0, max: 20 },
  speed: { type: Number, default: 0, min: 0, max: 15 },
  jump: { type: Number, default: 0, min: 0, max: 10 },
  bulletPower: { type: Number, default: 0, min: 0, max: 10 },
  magnetRadius: { type: Number, default: 0, min: 0, max: 5 }
}, { _id: false });

const achievementSchema = new Schema<IAchievement>({
  achievementId: { type: String, required: true },
  unlockedAt: { type: Date, default: Date.now }
}, { _id: false });

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 20 },
  email: { type: String, sparse: true, lowercase: true, trim: true },
  googleId: { type: String, sparse: true },
  passwordHash: { type: String },

  // Balances
  usdtBalance: { type: Number, default: 0, min: 0 },
  coins: { type: Number, default: 1000, min: 0 },
  gems: { type: Number, default: 50, min: 0 },

  // Stats
  gamesPlayed: { type: Number, default: 0, min: 0 },
  gamesWon: { type: Number, default: 0, min: 0 },
  totalDistance: { type: Number, default: 0, min: 0 },
  totalCoinsCollected: { type: Number, default: 0, min: 0 },
  highestArmy: { type: Number, default: 0, min: 0 },

  // Upgrades
  upgrades: { type: upgradesSchema, default: () => ({}) },

  // Customization
  currentSkin: { type: String, default: 'default' },
  ownedSkins: { type: [String], default: ['default'] },

  // Social
  friends: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  referralCode: { type: String, unique: true },
  referredBy: { type: String },

  // Daily
  dailyMissionsCompleted: { type: [String], default: [] },
  lastDailyReward: { type: Date },
  spinUsedToday: { type: Boolean, default: false },
  dailyStreak: { type: Number, default: 0, min: 0, max: 7 },

  // Achievements
  achievements: { type: [achievementSchema], default: [] }
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

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ referralCode: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
