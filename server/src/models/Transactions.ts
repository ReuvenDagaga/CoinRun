import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'game_reward' | 'mission_reward' | 'achievement_reward' | 'upgrade_purchase' | 'shop_purchase' | 'referral';
  currency: 'coins' | 'gems'; // VIRTUAL ONLY - NO USDT
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  relatedGameId?: mongoose.Types.ObjectId;
  relatedMissionId?: string;
  relatedAchievementId?: string;
  relatedItemId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['game_reward', 'mission_reward', 'achievement_reward', 'upgrade_purchase', 'shop_purchase', 'referral'],
    required: true
  },
  currency: { type: String, enum: ['coins', 'gems'], required: true },
  amount: { type: Number, required: true },
  balanceBefore: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  description: { type: String, required: true },
  relatedGameId: { type: Schema.Types.ObjectId, ref: 'RunnerGame' },
  relatedMissionId: { type: String },
  relatedAchievementId: { type: String },
  relatedItemId: { type: String },
  metadata: { type: Schema.Types.Mixed }
}, {
  timestamps: true
});

// Indexes
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ currency: 1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
