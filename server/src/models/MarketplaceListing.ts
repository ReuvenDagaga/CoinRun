import mongoose, { Schema, Document } from "mongoose";

export type ListingStatus = 'active' | 'sold' | 'cancelled' | 'expired';

export interface IMarketplaceListing extends Document {
  // Asset being sold
  assetId: mongoose.Types.ObjectId;

  // Seller info
  sellerId: mongoose.Types.ObjectId;

  // Pricing
  price: {
    coins?: number;
    gems?: number;
  };

  // Listing details
  status: ListingStatus;
  listedAt: Date;
  expiresAt?: Date;

  // Transaction details (when sold)
  buyerId?: mongoose.Types.ObjectId;
  soldAt?: Date;
  platformFee?: number;  // Percentage taken by platform

  // Stats
  views: number;
  favorites: number;

  createdAt: Date;
  updatedAt: Date;
}

const marketplaceListingSchema = new Schema<IMarketplaceListing>({
  assetId: {
    type: Schema.Types.ObjectId,
    ref: 'Asset',
    required: true,
    index: true
  },

  sellerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  price: {
    coins: { type: Number, min: 0 },
    gems: { type: Number, min: 0 }
  },

  status: {
    type: String,
    enum: ['active', 'sold', 'cancelled', 'expired'],
    default: 'active',
    index: true
  },

  listedAt: { type: Date, default: Date.now, index: true },
  expiresAt: { type: Date, index: true },

  // Transaction
  buyerId: { type: Schema.Types.ObjectId, ref: 'User' },
  soldAt: { type: Date },
  platformFee: { type: Number, default: 0.05, min: 0, max: 1 }, // 5% default

  // Stats
  views: { type: Number, default: 0, min: 0 },
  favorites: { type: Number, default: 0, min: 0 }
}, {
  timestamps: true
});

// Compound indexes for queries
marketplaceListingSchema.index({ status: 1, listedAt: -1 });
marketplaceListingSchema.index({ sellerId: 1, status: 1 });
marketplaceListingSchema.index({ assetId: 1, status: 1 });
marketplaceListingSchema.index({ 'price.coins': 1, 'price.gems': 1, status: 1 });

// Method to check if listing is expired
marketplaceListingSchema.methods.isExpired = function(): boolean {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Auto-expire listings (run periodically)
marketplaceListingSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'active' && this.isExpired()) {
    this.status = 'expired';
  }
  next();
});

export const MarketplaceListing = mongoose.model<IMarketplaceListing>('MarketplaceListing', marketplaceListingSchema);
