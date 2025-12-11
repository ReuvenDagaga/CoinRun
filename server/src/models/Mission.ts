import mongoose, { Schema, Document } from 'mongoose';

export interface IMission extends Document {
  missionId: string;
  type: 'daily' | 'weekly';
  title: string;
  description: string;
  requirement: {
    type: 'play_games' | 'collect_coins' | 'reach_army' | 'complete_without_hit' | 'finish_under_time' | 'collect_total_coins';
    target: number;
  };
  reward: {
    coins?: number;
    gems?: number;
  };
  active: boolean;
  order: number; // Display order
  createdAt: Date;
  updatedAt: Date;
}

const missionSchema = new Schema<IMission>({
  missionId: { type: String, required: true, unique: true },
  type: { type: String, enum: ['daily', 'weekly'], required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  requirement: {
    type: {
      type: String,
      enum: ['play_games', 'collect_coins', 'reach_army', 'complete_without_hit', 'finish_under_time', 'collect_total_coins'],
      required: true
    },
    target: { type: Number, required: true, min: 1 }
  },
  reward: {
    coins: { type: Number, min: 0 },
    gems: { type: Number, min: 0 }
  },
  active: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Indexes
missionSchema.index({ type: 1, active: 1 });

export const Mission = mongoose.model<IMission>('Mission', missionSchema);
