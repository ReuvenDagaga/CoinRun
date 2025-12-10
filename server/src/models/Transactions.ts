import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'deposit' | 'withdrawal' | 'bet' | 'win' | 'purchase' | 'reward' | 'referral';
  currency: 'usdt' | 'coins' | 'gems';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  relatedGameId?: mongoose.Types.ObjectId;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'bet', 'win', 'purchase', 'reward', 'referral'],
    required: true
  },
  currency: { type: String, enum: ['usdt', 'coins', 'gems'], required: true },
  amount: { type: Number, required: true },
  balanceBefore: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  description: { type: String, required: true },
  relatedGameId: { type: Schema.Types.ObjectId, ref: 'RunnerGame' },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'cancelled'], default: 'completed' },
  metadata: { type: Schema.Types.Mixed }
}, {
  timestamps: true
});

// Indexes
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
