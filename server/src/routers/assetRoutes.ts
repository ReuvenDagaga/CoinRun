import express, { Request, Response } from 'express';
import AssetService from '../services/asset.service.js';
import MarketplaceService from '../services/marketplace.service.js';
import CustomCharacterService from '../services/customCharacter.service.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// ========================================
// ASSET ROUTES
// ========================================

/**
 * GET /assets/official
 * Get all official platform assets
 */
router.get('/official', async (req: Request, res: Response) => {
  try {
    const { type, rarity, search } = req.query;

    const assets = await AssetService.getOfficialAssets({
      type: type as string,
      rarity: rarity as string,
      search: search as string
    });

    res.json({ success: true, assets });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /assets/my
 * Get user's owned assets
 */
router.get('/my', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id.toString();
    const { type, isFavorite } = req.query;

    const assets = await AssetService.getUserAssets(userId, {
      type: type as string,
      isFavorite: isFavorite === 'true'
    });

    res.json({ success: true, assets });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /assets/create
 * Create a new asset
 */
router.post('/create', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id.toString();
    const assetData = req.body;

    const asset = await AssetService.createAsset(userId, assetData);

    res.json({ success: true, asset });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * PUT /assets/:id
 * Update an asset
 */
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id.toString();
    const { id } = req.params;
    const updates = req.body;

    const asset = await AssetService.updateAsset(id, userId, updates);

    res.json({ success: true, asset });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /assets/:id
 * Delete an asset
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id.toString();
    const { id } = req.params;

    const result = await AssetService.deleteAsset(id, userId);

    res.json({ success: true, result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /assets/:id/favorite
 * Toggle favorite status
 */
router.post('/:id/favorite', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id.toString();
    const { id } = req.params;

    const userAsset = await AssetService.toggleFavorite(userId, id);

    res.json({ success: true, isFavorite: userAsset.isFavorite });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /assets/:id/rate
 * Rate an asset
 */
router.post('/:id/rate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id.toString();
    const { id } = req.params;
    const { rating } = req.body;

    const result = await AssetService.rateAsset(userId, id, rating);

    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /assets/:id/stats
 * Get asset statistics
 */
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const stats = await AssetService.getAssetStats(id);

    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /assets/:id/view
 * Increment asset views
 */
router.post('/:id/view', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await AssetService.incrementViews(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// MARKETPLACE ROUTES
// ========================================

/**
 * GET /assets/marketplace/listings
 * Get marketplace listings
 */
router.get('/marketplace/listings', async (req: Request, res: Response) => {
  try {
    const { type, rarity, minPrice, maxPrice, currency, search, sortBy } = req.query;

    const listings = await MarketplaceService.getListings({
      type: type as string,
      rarity: rarity as string,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      currency: currency as 'coins' | 'gems',
      search: search as string,
      sortBy: sortBy as any
    });

    res.json({ success: true, listings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /assets/marketplace/list
 * Create a marketplace listing
 */
router.post('/marketplace/list', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id.toString();
    const { assetId, price, expiresInDays } = req.body;

    const listing = await MarketplaceService.createListing(
      userId,
      assetId,
      price,
      expiresInDays
    );

    res.json({ success: true, listing });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /assets/marketplace/listings/:id
 * Cancel a marketplace listing
 */
router.delete('/marketplace/listings/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id.toString();
    const { id } = req.params;

    const listing = await MarketplaceService.cancelListing(id, userId);

    res.json({ success: true, listing });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /assets/marketplace/buy/:id
 * Purchase an asset from marketplace
 */
router.post('/marketplace/buy/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id.toString();
    const { id } = req.params;

    const result = await MarketplaceService.purchaseAsset(id, userId);

    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /assets/marketplace/my-listings
 * Get user's marketplace listings
 */
router.get('/marketplace/my-listings', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id.toString();
    const { status } = req.query;

    const listings = await MarketplaceService.getUserListings(userId, status as string);

    res.json({ success: true, listings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /assets/marketplace/my-purchases
 * Get user's purchase history
 */
router.get('/marketplace/my-purchases', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id.toString();

    const purchases = await MarketplaceService.getUserPurchases(userId);

    res.json({ success: true, purchases });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// CUSTOM CHARACTER ROUTES
// ========================================

/**
 * GET /assets/characters/my
 * Get user's custom characters
 */
router.get('/characters/my', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id.toString();

    const characters = await CustomCharacterService.getUserCharacters(userId);

    res.json({ success: true, characters });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /assets/characters/gallery
 * Get public character gallery
 */
router.get('/characters/gallery', async (req: Request, res: Response) => {
  try {
    const { sortBy, search, limit } = req.query;

    const characters = await CustomCharacterService.getPublicGallery({
      sortBy: sortBy as any,
      search: search as string,
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.json({ success: true, characters });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /assets/characters/:id
 * Get a custom character
 */
router.get('/characters/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const character = await CustomCharacterService.getCharacter(id);

    res.json({ success: true, character });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
});

/**
 * POST /assets/characters/create
 * Create a custom character
 */
router.post('/characters/create', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id.toString();
    const characterData = req.body;

    const character = await CustomCharacterService.createCharacter(userId, characterData);

    res.json({ success: true, character });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * PUT /assets/characters/:id
 * Update a custom character
 */
router.put('/characters/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id.toString();
    const { id } = req.params;
    const updates = req.body;

    const character = await CustomCharacterService.updateCharacter(id, userId, updates);

    res.json({ success: true, character });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /assets/characters/:id
 * Delete a custom character
 */
router.delete('/characters/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id.toString();
    const { id } = req.params;

    const result = await CustomCharacterService.deleteCharacter(id, userId);

    res.json({ success: true, result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /assets/characters/:id/equip
 * Equip a custom character
 */
router.post('/characters/:id/equip', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id.toString();
    const { id } = req.params;

    const character = await CustomCharacterService.equipCharacter(id, userId);

    res.json({ success: true, character });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /assets/characters/unequip
 * Unequip custom character
 */
router.post('/characters/unequip', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id.toString();

    const result = await CustomCharacterService.unequipCharacter(userId);

    res.json({ success: true, result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /assets/characters/:id/like
 * Like a character
 */
router.post('/characters/:id/like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await CustomCharacterService.likeCharacter(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
