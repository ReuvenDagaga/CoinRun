import { MarketplaceListing, IMarketplaceListing } from '../models/MarketplaceListing';
import { Asset } from '../models/Asset';
import { UserAsset } from '../models/UserAsset';
import { User } from '../models/Users';
import mongoose from 'mongoose';
import { TransactionService } from './transaction.service';

const PLATFORM_FEE = 0.05; // 5% platform fee

export class MarketplaceService {
  /**
   * Get active marketplace listings
   */
  static async getListings(filters?: {
    type?: string;
    rarity?: string;
    minPrice?: number;
    maxPrice?: number;
    currency?: 'coins' | 'gems';
    search?: string;
    sortBy?: 'newest' | 'popular' | 'price_low' | 'price_high';
  }) {
    const query: any = {
      status: 'active',
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    };

    const listings = await MarketplaceListing.find(query)
      .populate('assetId')
      .populate('sellerId', 'username avatar')
      .sort(this.getSortOrder(filters?.sortBy))
      .limit(100);

    // Filter by asset properties
    let filtered = listings;

    if (filters?.type || filters?.rarity || filters?.search) {
      filtered = listings.filter(listing => {
        const asset = listing.assetId as any;
        if (!asset) return false;

        if (filters.type && asset.type !== filters.type) return false;
        if (filters.rarity && asset.rarity !== filters.rarity) return false;
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const nameMatch = asset.name.toLowerCase().includes(searchLower);
          const tagMatch = asset.metadata?.tags?.some((tag: string) =>
            tag.toLowerCase().includes(searchLower)
          );
          if (!nameMatch && !tagMatch) return false;
        }

        return true;
      });
    }

    // Filter by price
    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      filtered = filtered.filter(listing => {
        const price = filters.currency === 'gems'
          ? listing.price.gems || 0
          : listing.price.coins || 0;

        if (filters.minPrice !== undefined && price < filters.minPrice) return false;
        if (filters.maxPrice !== undefined && price > filters.maxPrice) return false;

        return true;
      });
    }

    return filtered;
  }

  /**
   * Create a new marketplace listing
   */
  static async createListing(
    userId: string,
    assetId: string,
    price: { coins?: number; gems?: number },
    expiresInDays?: number
  ) {
    // Verify user owns the asset
    const userAsset = await UserAsset.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      assetId: new mongoose.Types.ObjectId(assetId)
    });

    if (!userAsset) {
      throw new Error('You do not own this asset');
    }

    // Verify asset exists and is approved
    const asset = await Asset.findById(assetId);
    if (!asset) {
      throw new Error('Asset not found');
    }

    if (!asset.isApproved && !asset.isOfficial) {
      throw new Error('Asset must be approved before listing on marketplace');
    }

    // Check if already listed
    const existingListing = await MarketplaceListing.findOne({
      assetId: asset._id,
      sellerId: new mongoose.Types.ObjectId(userId),
      status: 'active'
    });

    if (existingListing) {
      throw new Error('This asset is already listed');
    }

    // Validate price
    if (!price.coins && !price.gems) {
      throw new Error('Price must include coins or gems');
    }

    if ((price.coins && price.coins < 0) || (price.gems && price.gems < 0)) {
      throw new Error('Price must be positive');
    }

    // Create listing
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    const listing = new MarketplaceListing({
      assetId: asset._id,
      sellerId: new mongoose.Types.ObjectId(userId),
      price,
      status: 'active',
      expiresAt,
      platformFee: PLATFORM_FEE
    });

    await listing.save();

    return listing;
  }

  /**
   * Cancel a marketplace listing
   */
  static async cancelListing(listingId: string, userId: string) {
    const listing = await MarketplaceListing.findById(listingId);

    if (!listing) {
      throw new Error('Listing not found');
    }

    if (listing.sellerId.toString() !== userId) {
      throw new Error('Not authorized to cancel this listing');
    }

    if (listing.status !== 'active') {
      throw new Error('Listing is not active');
    }

    listing.status = 'cancelled';
    await listing.save();

    return listing;
  }

  /**
   * Purchase an asset from marketplace
   */
  static async purchaseAsset(listingId: string, buyerId: string) {
    const listing = await MarketplaceListing.findById(listingId)
      .populate('assetId')
      .populate('sellerId');

    if (!listing) {
      throw new Error('Listing not found');
    }

    if (listing.status !== 'active') {
      throw new Error('Listing is no longer available');
    }

    if ((listing as any).isExpired()) {
      listing.status = 'expired';
      await listing.save();
      throw new Error('Listing has expired');
    }

    const seller = await User.findById(listing.sellerId);
    const buyer = await User.findById(buyerId);
    const asset = listing.assetId as any;

    if (!seller || !buyer || !asset) {
      throw new Error('Invalid transaction');
    }

    if (buyerId === listing.sellerId.toString()) {
      throw new Error('Cannot buy your own listing');
    }

    // Check if buyer already owns this asset
    const existingOwnership = await UserAsset.findOne({
      userId: new mongoose.Types.ObjectId(buyerId),
      assetId: asset._id
    });

    if (existingOwnership) {
      throw new Error('You already own this asset');
    }

    // Check if buyer can afford
    const priceCoins = listing.price.coins || 0;
    const priceGems = listing.price.gems || 0;

    if (buyer.coins < priceCoins || buyer.gems < priceGems) {
      throw new Error('Insufficient funds');
    }

    // Calculate platform fee
    const feeCoins = Math.floor(priceCoins * listing.platformFee);
    const feeGems = Math.floor(priceGems * listing.platformFee);
    const sellerCoins = priceCoins - feeCoins;
    const sellerGems = priceGems - feeGems;

    // Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Deduct from buyer
      buyer.coins -= priceCoins;
      buyer.gems -= priceGems;
      await buyer.save({ session });

      // Pay seller (minus platform fee)
      seller.coins += sellerCoins;
      seller.gems += sellerGems;

      // Update seller's creator stats
      if (!seller.creatorStats) {
        seller.creatorStats = {
          totalAssetsSold: 0,
          totalEarnings: { coins: 0, gems: 0 },
          creatorRating: 0,
          ratingCount: 0
        };
      }
      seller.creatorStats.totalAssetsSold += 1;
      seller.creatorStats.totalEarnings.coins += sellerCoins;
      seller.creatorStats.totalEarnings.gems += sellerGems;
      await seller.save({ session });

      // Transfer asset ownership
      const newUserAsset = new UserAsset({
        userId: buyer._id,
        assetId: asset._id,
        acquiredFrom: 'purchase',
        purchasePrice: listing.price,
        purchasedFromUserId: seller._id
      });
      await newUserAsset.save({ session });

      // Update listing status
      listing.status = 'sold';
      listing.buyerId = buyer._id;
      listing.soldAt = new Date();
      await listing.save({ session });

      // Increment asset downloads
      asset.downloads += 1;
      await asset.save({ session });

      // Log transactions
      await TransactionService.logTransaction({
        userId: buyer._id.toString(),
        type: 'marketplace_purchase',
        currency: 'coins',
        amount: -priceCoins,
        balanceBefore: buyer.coins + priceCoins,
        balanceAfter: buyer.coins,
        metadata: { listingId: listing._id, assetId: asset._id }
      }, session);

      if (priceGems > 0) {
        await TransactionService.logTransaction({
          userId: buyer._id.toString(),
          type: 'marketplace_purchase',
          currency: 'gems',
          amount: -priceGems,
          balanceBefore: buyer.gems + priceGems,
          balanceAfter: buyer.gems,
          metadata: { listingId: listing._id, assetId: asset._id }
        }, session);
      }

      await TransactionService.logTransaction({
        userId: seller._id.toString(),
        type: 'marketplace_sale',
        currency: 'coins',
        amount: sellerCoins,
        balanceBefore: seller.coins - sellerCoins,
        balanceAfter: seller.coins,
        metadata: { listingId: listing._id, assetId: asset._id, fee: feeCoins }
      }, session);

      if (priceGems > 0) {
        await TransactionService.logTransaction({
          userId: seller._id.toString(),
          type: 'marketplace_sale',
          currency: 'gems',
          amount: sellerGems,
          balanceBefore: seller.gems - sellerGems,
          balanceAfter: seller.gems,
          metadata: { listingId: listing._id, assetId: asset._id, fee: feeGems }
        }, session);
      }

      await session.commitTransaction();
      session.endSession();

      return {
        listing,
        buyer,
        seller,
        asset
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Get user's marketplace listings (as seller)
   */
  static async getUserListings(userId: string, status?: string) {
    const query: any = { sellerId: new mongoose.Types.ObjectId(userId) };

    if (status) {
      query.status = status;
    }

    const listings = await MarketplaceListing.find(query)
      .populate('assetId')
      .populate('buyerId', 'username avatar')
      .sort({ listedAt: -1 });

    return listings;
  }

  /**
   * Get user's purchase history
   */
  static async getUserPurchases(userId: string) {
    const listings = await MarketplaceListing.find({
      buyerId: new mongoose.Types.ObjectId(userId),
      status: 'sold'
    })
      .populate('assetId')
      .populate('sellerId', 'username avatar')
      .sort({ soldAt: -1 });

    return listings;
  }

  /**
   * Increment listing views
   */
  static async incrementViews(listingId: string) {
    await MarketplaceListing.findByIdAndUpdate(listingId, { $inc: { views: 1 } });
  }

  /**
   * Toggle listing favorite
   */
  static async toggleFavorite(listingId: string) {
    await MarketplaceListing.findByIdAndUpdate(listingId, { $inc: { favorites: 1 } });
  }

  // Helper method to get sort order
  private static getSortOrder(sortBy?: string) {
    switch (sortBy) {
      case 'popular':
        return { views: -1, favorites: -1 };
      case 'price_low':
        return { 'price.coins': 1, 'price.gems': 1 };
      case 'price_high':
        return { 'price.coins': -1, 'price.gems': -1 };
      case 'newest':
      default:
        return { listedAt: -1 };
    }
  }
}

export default MarketplaceService;
