import mongoose, { Schema, Document } from 'mongoose';

export interface ILeaderboardReward extends Document {
  date: Date; // UTC date (without time) for the reward period
  distributedAt: Date;
  rewards: {
    userId: mongoose.Types.ObjectId;
    rank: number;
    powerLevel: number;
    coins: number;
    gems: number;
    chest: 'legendary' | 'simple' | null;
  }[];
}

const leaderboardRewardSchema = new Schema<ILeaderboardReward>({
  date: { type: Date, required: true, unique: true },
  distributedAt: { type: Date, required: true },
  rewards: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rank: { type: Number, required: true },
    powerLevel: { type: Number, required: true },
    coins: { type: Number, required: true },
    gems: { type: Number, required: true },
    chest: { type: String, enum: ['legendary', 'simple', null], default: null }
  }]
});

leaderboardRewardSchema.index({ date: -1 });
leaderboardRewardSchema.index({ 'rewards.userId': 1 });

export const LeaderboardReward = mongoose.model<ILeaderboardReward>('LeaderboardReward', leaderboardRewardSchema);
