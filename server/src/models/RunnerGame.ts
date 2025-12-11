import mongoose, { Schema, Document } from 'mongoose';

export interface IRunnerGame extends Document {
  gameType: 'solo'; // Only solo mode - 1v1 betting removed

  // Single player result (solo only)
  userId: mongoose.Types.ObjectId;
  finalScore: number;
  coinsCollected: number;
  maxArmy: number;
  distanceTraveled: number;
  timeTaken: number;
  didFinish: boolean;
  enemiesKilled: number;
  perfectGates: number;

  // Snapshot of upgrade levels at game start
  upgradeLevels: {
    capacity: number;
    addWarrior: number;
    warriorUpgrade: number;
    income: number;
    speed: number;
    jump: number;
    bulletPower: number;
    magnetRadius: number;
  };

  trackSeed: string;
  trackDifficulty: number;

  startedAt: Date;
  finishedAt?: Date;
  duration?: number;

  status: 'pending' | 'in_progress' | 'finished' | 'cancelled';

  createdAt: Date;
  updatedAt: Date;
}

const runnerGameSchema = new Schema<IRunnerGame>({
  gameType: { type: String, enum: ['solo'], default: 'solo', required: true },

  // Solo player data
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  finalScore: { type: Number, default: 0 },
  coinsCollected: { type: Number, default: 0 },
  maxArmy: { type: Number, default: 0 },
  distanceTraveled: { type: Number, default: 0 },
  timeTaken: { type: Number, default: 0 },
  didFinish: { type: Boolean, default: false },
  enemiesKilled: { type: Number, default: 0 },
  perfectGates: { type: Number, default: 0 },

  // Snapshot of upgrade levels at game start (for anti-cheat)
  upgradeLevels: {
    capacity: { type: Number, default: 0 },
    addWarrior: { type: Number, default: 0 },
    warriorUpgrade: { type: Number, default: 0 },
    income: { type: Number, default: 0 },
    speed: { type: Number, default: 0 },
    jump: { type: Number, default: 0 },
    bulletPower: { type: Number, default: 0 },
    magnetRadius: { type: Number, default: 0 }
  },

  trackSeed: { type: String, required: true },
  trackDifficulty: { type: Number, default: 1 },

  startedAt: { type: Date, default: Date.now },
  finishedAt: { type: Date },
  duration: { type: Number },

  status: { type: String, enum: ['pending', 'in_progress', 'finished', 'cancelled'], default: 'pending' }
}, {
  timestamps: true
});

// Indexes for queries
runnerGameSchema.index({ userId: 1 });
runnerGameSchema.index({ userId: 1, startedAt: -1 }); // For user game history
runnerGameSchema.index({ startedAt: -1 });
runnerGameSchema.index({ status: 1 });

export const RunnerGame = mongoose.model<IRunnerGame>('RunnerGame', runnerGameSchema);
