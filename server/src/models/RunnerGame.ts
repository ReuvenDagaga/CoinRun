import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayerResult {
  userId: mongoose.Types.ObjectId;
  finalScore: number;
  coinsCollected: number;
  maxArmy: number;
  distanceTraveled: number;
  timeTaken: number;
  didFinish: boolean;
  enemiesKilled: number;
  perfectGates: number;
}

export interface IRunnerGame extends Document {
  gameType: 'solo' | '1v1';

  players: IPlayerResult[];

  betAmount?: number;
  winnerId?: mongoose.Types.ObjectId;

  trackSeed: string;
  trackDifficulty: number;

  startedAt: Date;
  finishedAt?: Date;
  duration?: number;

  status: 'pending' | 'in_progress' | 'finished' | 'cancelled';
}

const playerResultSchema = new Schema<IPlayerResult>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  finalScore: { type: Number, default: 0 },
  coinsCollected: { type: Number, default: 0 },
  maxArmy: { type: Number, default: 0 },
  distanceTraveled: { type: Number, default: 0 },
  timeTaken: { type: Number, default: 0 },
  didFinish: { type: Boolean, default: false },
  enemiesKilled: { type: Number, default: 0 },
  perfectGates: { type: Number, default: 0 }
}, { _id: false });

const runnerGameSchema = new Schema<IRunnerGame>({
  gameType: { type: String, enum: ['solo', '1v1'], required: true },

  players: { type: [playerResultSchema], default: [] },

  betAmount: { type: Number, min: 0 },
  winnerId: { type: Schema.Types.ObjectId, ref: 'User' },

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
runnerGameSchema.index({ 'players.userId': 1 });
runnerGameSchema.index({ startedAt: -1 });
runnerGameSchema.index({ gameType: 1, status: 1 });

export const RunnerGame = mongoose.model<IRunnerGame>('RunnerGame', runnerGameSchema);
