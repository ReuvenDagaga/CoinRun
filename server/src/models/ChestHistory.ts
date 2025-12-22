import mongoose, { Schema, Document } from 'mongoose';
import { ChestTier } from '@shared/interface/IChest.js';
import { CardRarity } from '@shared/interface/ICard.js';

export interface IChestHistory extends Document {
  userId: mongoose.Types.ObjectId;
  chestTier: ChestTier;
  source: 'timed' | 'purchased' | 'reward';
  rewards: {
    cards: Array<{
      cardId: string;
      rarity: CardRarity;
      isDuplicate: boolean;
      conversionReward?: { coins: number; gems: number };
    }>;
    coins: number;
    gems: number;
  };
  openedAt: Date;
}

const chestHistorySchema = new Schema<IChestHistory>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  chestTier: {
    type: String,
    enum: ['bronze', 'silver', 'gold'],
    required: true
  },
  source: {
    type: String,
    enum: ['timed', 'purchased', 'reward'],
    required: true
  },
  rewards: {
    cards: [{
      cardId: { type: String, required: true },
      rarity: {
        type: String,
        enum: ['uncommon', 'common', 'rare', 'epic', 'legendary'],
        required: true
      },
      isDuplicate: { type: Boolean, default: false },
      conversionReward: {
        coins: { type: Number },
        gems: { type: Number }
      }
    }],
    coins: { type: Number, required: true, default: 0 },
    gems: { type: Number, required: true, default: 0 }
  },
  openedAt: { type: Date, default: Date.now }
}, {
  timestamps: false
});

// Compound index for efficient queries
chestHistorySchema.index({ userId: 1, openedAt: -1 });
chestHistorySchema.index({ chestTier: 1, openedAt: -1 });

export const ChestHistory = mongoose.model<IChestHistory>('ChestHistory', chestHistorySchema);
