import { Asset, IAsset } from '../models/Asset';
import { UserAsset, IUserAsset } from '../models/UserAsset';
import { CustomCharacter, ICustomCharacter } from '../models/CustomCharacter';
import { MarketplaceListing, IMarketplaceListing } from '../models/MarketplaceListing';
import { User } from '../models/Users';
import mongoose from 'mongoose';

export class AssetService {
  /**
   * Get all official assets (created by platform)
   */
  static async getOfficialAssets(filters?: {
    type?: string;
    rarity?: string;
    search?: string;
  }) {
    const query: any = {
      isOfficial: true,
      isActive: true,
      isApproved: true
    };

    if (filters?.type) {
      query.type = filters.type;
    }

    if (filters?.rarity) {
      query.rarity = filters.rarity;
    }

    if (filters?.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { 'metadata.tags': { $regex: filters.search, $options: 'i' } }
      ];
    }

    const assets = await Asset.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    return assets;
  }

  /**
   * Get user's owned assets
   */
  static async getUserAssets(userId: string, filters?: {
    type?: string;
    isFavorite?: boolean;
  }) {
    const query: any = { userId: new mongoose.Types.ObjectId(userId) };

    if (filters?.isFavorite !== undefined) {
      query.isFavorite = filters.isFavorite;
    }

    const userAssets = await UserAsset.find(query)
      .populate<{ assetId: IAsset }>('assetId')
      .sort({ acquiredAt: -1 });

    // Filter by asset type if specified
    let filteredAssets = userAssets;
    if (filters?.type) {
      filteredAssets = userAssets.filter(
        ua => ua.assetId && (ua.assetId as any).type === filters.type
      );
    }

    return filteredAssets;
  }

  /**
   * Create a new asset
   */
  static async createAsset(
    userId: string,
    assetData: {
      name: string;
      type: string;
      geometry: any[];
      colors?: any;
      bodyScale?: any;
      metadata?: any;
      isForSale?: boolean;
      basePrice?: any;
    }
  ) {
    // Create the asset
    const asset = new Asset({
      ...assetData,
      creatorId: new mongoose.Types.ObjectId(userId),
      isOfficial: false,
      isApproved: false, // Needs approval for marketplace
      isActive: true
    });

    await asset.save();

    // Automatically add to user's inventory
    const userAsset = new UserAsset({
      userId: new mongoose.Types.ObjectId(userId),
      assetId: asset._id,
      acquiredFrom: 'creation'
    });

    await userAsset.save();

    return asset;
  }

  /**
   * Update an asset (only if user is the creator)
   */
  static async updateAsset(
    assetId: string,
    userId: string,
    updates: Partial<IAsset>
  ) {
    const asset = await Asset.findById(assetId);

    if (!asset) {
      throw new Error('Asset not found');
    }

    if (asset.creatorId.toString() !== userId && !asset.isOfficial) {
      throw new Error('Not authorized to update this asset');
    }

    Object.assign(asset, updates);
    await asset.save();

    return asset;
  }

  /**
   * Delete an asset (only if user is the creator)
   */
  static async deleteAsset(assetId: string, userId: string) {
    const asset = await Asset.findById(assetId);

    if (!asset) {
      throw new Error('Asset not found');
    }

    if (asset.creatorId.toString() !== userId) {
      throw new Error('Not authorized to delete this asset');
    }

    // Check if asset is being used in any custom characters
    const usageCount = await CustomCharacter.countDocuments({
      $or: [
        { 'parts.head': assetId },
        { 'parts.torso': assetId },
        { 'parts.leftArm': assetId },
        { 'parts.rightArm': assetId },
        { 'parts.leftLeg': assetId },
        { 'parts.rightLeg': assetId },
        { 'parts.hair': assetId },
        { 'parts.face': assetId },
        { 'parts.accessories': assetId }
      ]
    });

    if (usageCount > 0) {
      throw new Error('Cannot delete asset that is being used in custom characters');
    }

    // Delete from user inventories
    await UserAsset.deleteMany({ assetId: asset._id });

    // Delete marketplace listings
    await MarketplaceListing.deleteMany({ assetId: asset._id });

    // Delete the asset
    await asset.deleteOne();

    return { success: true };
  }

  /**
   * Toggle favorite status
   */
  static async toggleFavorite(userId: string, assetId: string) {
    const userAsset = await UserAsset.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      assetId: new mongoose.Types.ObjectId(assetId)
    });

    if (!userAsset) {
      throw new Error('Asset not found in user inventory');
    }

    userAsset.isFavorite = !userAsset.isFavorite;
    await userAsset.save();

    return userAsset;
  }

  /**
   * Rate an asset
   */
  static async rateAsset(userId: string, assetId: string, rating: number) {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const userAsset = await UserAsset.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      assetId: new mongoose.Types.ObjectId(assetId)
    });

    if (!userAsset) {
      throw new Error('You must own this asset to rate it');
    }

    const asset = await Asset.findById(assetId);
    if (!asset) {
      throw new Error('Asset not found');
    }

    // Update user's rating
    const previousRating = userAsset.rating?.rating;
    userAsset.rating = {
      rating,
      ratedAt: new Date()
    };
    await userAsset.save();

    // Update asset's average rating
    if (previousRating) {
      // Remove old rating from average
      const totalRating = asset.rating * asset.ratingCount;
      const newTotal = totalRating - previousRating + rating;
      asset.rating = newTotal / asset.ratingCount;
    } else {
      // New rating
      const totalRating = asset.rating * asset.ratingCount + rating;
      asset.ratingCount += 1;
      asset.rating = totalRating / asset.ratingCount;
    }

    await asset.save();

    return { asset, userAsset };
  }

  /**
   * Get asset statistics
   */
  static async getAssetStats(assetId: string) {
    const asset = await Asset.findById(assetId);
    if (!asset) {
      throw new Error('Asset not found');
    }

    const totalOwners = await UserAsset.countDocuments({ assetId: asset._id });
    const totalTimesUsed = await UserAsset.aggregate([
      { $match: { assetId: asset._id } },
      { $group: { _id: null, total: { $sum: '$timesUsed' } } }
    ]);

    return {
      asset,
      totalOwners,
      totalTimesUsed: totalTimesUsed[0]?.total || 0,
      popularityScore: (asset as any).popularityScore
    };
  }

  /**
   * Increment asset views
   */
  static async incrementViews(assetId: string) {
    await Asset.findByIdAndUpdate(assetId, { $inc: { views: 1 } });
  }

  /**
   * Increment asset downloads (equips)
   */
  static async incrementDownloads(assetId: string) {
    await Asset.findByIdAndUpdate(assetId, { $inc: { downloads: 1 } });
  }
}

export default AssetService;
