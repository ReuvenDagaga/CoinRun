import mongoose, { Schema, Document } from 'mongoose';

export interface IAchievement extends Document {
  achievementId: string;
  name: string;
  description: string;
  icon: string;
  requirement: {
    type: 'games_played' | 'games_won' | 'total_coins' | 'total_distance' | 'highest_army' | 'best_score' | 'upgrade_level';
    target: number;
    upgradeType?: string; // For upgrade_level type
  };
  reward: {
    coins?: number;
    gems?: number;
  };
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  active: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const achievementSchema = new Schema<IAchievement>({
  achievementId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  requirement: {
    type: {
      type: String,
      enum: ['games_played', 'games_won', 'total_coins', 'total_distance', 'highest_army', 'best_score', 'upgrade_level'],
      required: true
    },
    target: { type: Number, required: true, min: 1 },
    upgradeType: { type: String }
  },
  reward: {
    coins: { type: Number, min: 0 },
    gems: { type: Number, min: 0 }
  },
  tier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'], default: 'bronze' },
  active: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Indexes
achievementSchema.index({ tier: 1, active: 1 });
achievementSchema.index({ order: 1 });

export const Achievement = mongoose.model<IAchievement>('Achievement', achievementSchema);
