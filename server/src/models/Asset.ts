import mongoose, { Schema, Document } from "mongoose";

export type AssetType =
  | 'full_character'  // דמות שלמה
  | 'head'            // ראש
  | 'torso'           // גוף עליון
  | 'arm'             // יד (זוג)
  | 'leg'             // רגל (זוג)
  | 'accessory'       // אביזר (כובע, משקפיים, וכו')
  | 'hair'            // שיער
  | 'face'            // פנים
  | 'outfit';         // לבוש מלא

export type AssetRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface IAssetGeometry {
  // Three.js geometry data - stored as JSON
  type: string;  // 'BoxGeometry', 'SphereGeometry', 'CylinderGeometry', etc.
  params: any[];  // Constructor parameters
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export interface IAssetColors {
  primary?: string;
  secondary?: string;
  accent?: string;
  skin?: string;
  hair?: string;
  eyes?: string;
  [key: string]: string | undefined;
}

export interface IAssetMetadata {
  tags: string[];           // searchable tags like 'robot', 'medieval', 'cute'
  description?: string;
  thumbnailUrl?: string;    // URL to preview image
  compatibleWith?: string[]; // Compatible asset IDs
  animationSupport?: boolean;
}

export interface IAsset extends Document {
  // Basic Info
  name: string;
  type: AssetType;

  // Ownership
  creatorId: mongoose.Types.ObjectId;
  isOfficial: boolean;  // Created by admins/platform

  // Visual Properties
  rarity: AssetRarity;
  geometry: IAssetGeometry[];  // Array of 3D parts
  colors: IAssetColors;
  bodyScale?: {
    x?: number;
    y?: number;
    z?: number;
  };

  // Metadata
  metadata: IAssetMetadata;

  // Stats & Social
  views: number;
  downloads: number;  // times equipped by users
  rating: number;     // average rating (0-5)
  ratingCount: number;

  // Marketplace
  isForSale: boolean;
  basePrice?: {
    coins?: number;
    gems?: number;
  };

  // Status
  isActive: boolean;  // Can be disabled by creator or admin
  isApproved: boolean; // Must be approved for marketplace

  createdAt: Date;
  updatedAt: Date;
}

const assetGeometrySchema = new Schema<IAssetGeometry>({
  type: { type: String, required: true },
  params: { type: Schema.Types.Mixed, required: true },
  position: { type: [Number], default: [0, 0, 0] },
  rotation: { type: [Number], default: [0, 0, 0] },
  scale: { type: [Number], default: [1, 1, 1] }
}, { _id: false });

const assetColorsSchema = new Schema<IAssetColors>({
  primary: { type: String },
  secondary: { type: String },
  accent: { type: String },
  skin: { type: String },
  hair: { type: String },
  eyes: { type: String }
}, { _id: false, strict: false }); // Allow dynamic color keys

const assetMetadataSchema = new Schema<IAssetMetadata>({
  tags: { type: [String], default: [] },
  description: { type: String, maxlength: 500 },
  thumbnailUrl: { type: String },
  compatibleWith: { type: [String], default: [] },
  animationSupport: { type: Boolean, default: true }
}, { _id: false });

const assetSchema = new Schema<IAsset>({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 50,
    index: 'text'  // Enable text search
  },
  type: {
    type: String,
    required: true,
    enum: ['full_character', 'head', 'torso', 'arm', 'leg', 'accessory', 'hair', 'face', 'outfit'],
    index: true
  },

  // Ownership
  creatorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  isOfficial: { type: Boolean, default: false, index: true },

  // Visual
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary', 'mythic'],
    default: 'common',
    index: true
  },
  geometry: { type: [assetGeometrySchema], required: true },
  colors: { type: assetColorsSchema, default: () => ({}) },
  bodyScale: {
    x: { type: Number, default: 1, min: 0.5, max: 2 },
    y: { type: Number, default: 1, min: 0.5, max: 2 },
    z: { type: Number, default: 1, min: 0.5, max: 2 }
  },

  // Metadata
  metadata: { type: assetMetadataSchema, default: () => ({}) },

  // Stats
  views: { type: Number, default: 0, min: 0 },
  downloads: { type: Number, default: 0, min: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  ratingCount: { type: Number, default: 0, min: 0 },

  // Marketplace
  isForSale: { type: Boolean, default: false, index: true },
  basePrice: {
    coins: { type: Number, min: 0 },
    gems: { type: Number, min: 0 }
  },

  // Status
  isActive: { type: Boolean, default: true, index: true },
  isApproved: { type: Boolean, default: false, index: true }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
assetSchema.index({ type: 1, rarity: 1 });
assetSchema.index({ isForSale: 1, isApproved: 1, isActive: 1 });
assetSchema.index({ creatorId: 1, createdAt: -1 });
assetSchema.index({ rating: -1, ratingCount: -1 }); // For trending/popular
assetSchema.index({ 'metadata.tags': 1 }); // Tag search

// Virtual for popularity score
assetSchema.virtual('popularityScore').get(function() {
  return (this.downloads * 2) + (this.rating * this.ratingCount * 10) + this.views;
});

export const Asset = mongoose.model<IAsset>('Asset', assetSchema);
