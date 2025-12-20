import mongoose, { Schema, Document } from "mongoose";

export type AssetAcquisitionSource =
  | 'purchase'       // Bought from marketplace
  | 'creation'       // Created by user
  | 'gift'           // Received as gift
  | 'reward'         // Mission/achievement reward
  | 'lootbox'        // From loot box
  | 'admin';         // Given by admin

export interface IUserAssetRating {
  rating: number;     // 1-5 stars
  ratedAt: Date;
}

export interface IUserAsset extends Document {
  // References
  userId: mongoose.Types.ObjectId;
  assetId: mongoose.Types.ObjectId;

  // Acquisition
  acquiredAt: Date;
  acquiredFrom: AssetAcquisitionSource;
  purchasePrice?: {
    coins?: number;
    gems?: number;
  };
  purchasedFromUserId?: mongoose.Types.ObjectId;  // If bought from another user

  // User actions
  isFavorite: boolean;
  isEquipped: boolean;  // Currently using this asset
  timesUsed: number;    // How many times equipped
  rating?: IUserAssetRating;

  createdAt: Date;
  updatedAt: Date;
}

const userAssetRatingSchema = new Schema<IUserAssetRating>({
  rating: { type: Number, required: true, min: 1, max: 5 },
  ratedAt: { type: Date, default: Date.now }
}, { _id: false });

const userAssetSchema = new Schema<IUserAsset>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  assetId: {
    type: Schema.Types.ObjectId,
    ref: 'Asset',
    required: true,
    index: true
  },

  // Acquisition
  acquiredAt: { type: Date, default: Date.now, index: true },
  acquiredFrom: {
    type: String,
    enum: ['purchase', 'creation', 'gift', 'reward', 'lootbox', 'admin'],
    required: true,
    index: true
  },
  purchasePrice: {
    coins: { type: Number, min: 0 },
    gems: { type: Number, min: 0 }
  },
  purchasedFromUserId: { type: Schema.Types.ObjectId, ref: 'User' },

  // User actions
  isFavorite: { type: Boolean, default: false, index: true },
  isEquipped: { type: Boolean, default: false, index: true },
  timesUsed: { type: Number, default: 0, min: 0 },
  rating: { type: userAssetRatingSchema }
}, {
  timestamps: true
});

// Unique constraint: User can only own each asset once
userAssetSchema.index({ userId: 1, assetId: 1 }, { unique: true });

// Compound indexes
userAssetSchema.index({ userId: 1, isFavorite: 1 });
userAssetSchema.index({ userId: 1, isEquipped: 1 });
userAssetSchema.index({ userId: 1, acquiredAt: -1 });

export const UserAsset = mongoose.model<IUserAsset>('UserAsset', userAssetSchema);
