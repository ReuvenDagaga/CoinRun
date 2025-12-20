import mongoose, { Schema, Document } from "mongoose";

export interface ICharacterParts {
  head?: string;          // Asset ID
  torso?: string;         // Asset ID
  leftArm?: string;       // Asset ID
  rightArm?: string;      // Asset ID
  leftLeg?: string;       // Asset ID
  rightLeg?: string;      // Asset ID
  hair?: string;          // Asset ID
  face?: string;          // Asset ID
  accessories: string[];  // Array of Asset IDs
}

export interface ICustomCharacter extends Document {
  // Basic Info
  name: string;
  userId: mongoose.Types.ObjectId;

  // Composition - references to Asset IDs
  parts: ICharacterParts;

  // Overall character properties
  overallScale?: number;
  overallColors?: {
    [partName: string]: string;  // Override colors for specific parts
  };

  // Status
  isEquipped: boolean;  // Currently equipped by user
  isPublic: boolean;    // Visible in gallery/marketplace

  // Metadata
  thumbnailUrl?: string;
  description?: string;
  tags: string[];

  // Stats
  views: number;
  likes: number;

  createdAt: Date;
  updatedAt: Date;
}

const characterPartsSchema = new Schema<ICharacterParts>({
  head: { type: String, ref: 'Asset' },
  torso: { type: String, ref: 'Asset' },
  leftArm: { type: String, ref: 'Asset' },
  rightArm: { type: String, ref: 'Asset' },
  leftLeg: { type: String, ref: 'Asset' },
  rightLeg: { type: String, ref: 'Asset' },
  hair: { type: String, ref: 'Asset' },
  face: { type: String, ref: 'Asset' },
  accessories: [{ type: String, ref: 'Asset' }]
}, { _id: false });

const customCharacterSchema = new Schema<ICustomCharacter>({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Composition
  parts: { type: characterPartsSchema, required: true },

  // Properties
  overallScale: { type: Number, default: 1, min: 0.5, max: 2 },
  overallColors: { type: Map, of: String },

  // Status
  isEquipped: { type: Boolean, default: false, index: true },
  isPublic: { type: Boolean, default: false, index: true },

  // Metadata
  thumbnailUrl: { type: String },
  description: { type: String, maxlength: 200 },
  tags: { type: [String], default: [], index: true },

  // Stats
  views: { type: Number, default: 0, min: 0 },
  likes: { type: Number, default: 0, min: 0 }
}, {
  timestamps: true
});

// Only one character can be equipped per user
customCharacterSchema.index({ userId: 1, isEquipped: 1 }, { unique: true, partialFilterExpression: { isEquipped: true } });

// Compound indexes
customCharacterSchema.index({ userId: 1, createdAt: -1 });
customCharacterSchema.index({ isPublic: 1, likes: -1 }); // For public gallery sorted by popularity

export const CustomCharacter = mongoose.model<ICustomCharacter>('CustomCharacter', customCharacterSchema);
