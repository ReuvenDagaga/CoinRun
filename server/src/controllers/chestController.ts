import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { ApiRes } from '../utils/response.js';
import { LOGGER } from '../log/logger.js';
import {
  getChestStatus,
  claimTimedChest,
  purchaseChest,
  getDropRateInfo,
  getChestHistory
} from '../services/chest.service.js';
import { ChestTier } from '@shared/interface/IChest.js';

/**
 * Get current chest status (timed chest timer)
 */
export const getStatus = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return ApiRes.unauthorized(res);

    const status = getChestStatus(user);
    await user.save(); // Save in case a new chest was generated

    return ApiRes.ok(res, status);
  } catch (error: any) {
    LOGGER.error('Get chest status error:', error.message);
    return ApiRes.serverError(res, 'Failed to get chest status');
  }
};

/**
 * Claim the ready timed chest
 */
export const claimChest = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return ApiRes.unauthorized(res);

    const reward = await claimTimedChest(user);
    const newStatus = getChestStatus(user);

    return ApiRes.ok(res, {
      reward,
      newStatus,
      balance: { coins: user.coins, gems: user.gems }
    });
  } catch (error: any) {
    LOGGER.error('Claim chest error:', error.message);
    if (error.message.includes('No chest')) {
      return ApiRes.badRequest(res, error.message);
    }
    return ApiRes.serverError(res, 'Failed to claim chest');
  }
};

/**
 * Purchase a chest with gems
 */
export const buyChest = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return ApiRes.unauthorized(res);

    const { tier } = req.body;
    if (!tier || !['bronze', 'silver', 'gold'].includes(tier)) {
      return ApiRes.badRequest(res, 'Invalid chest tier. Must be bronze, silver, or gold');
    }

    const reward = await purchaseChest(user, tier as ChestTier);

    return ApiRes.ok(res, {
      reward,
      balance: { coins: user.coins, gems: user.gems }
    });
  } catch (error: any) {
    LOGGER.error('Buy chest error:', error.message);
    if (error.message.includes('Insufficient')) {
      return ApiRes.badRequest(res, error.message);
    }
    return ApiRes.serverError(res, 'Failed to purchase chest');
  }
};

/**
 * Get drop rates info (public endpoint for transparency)
 */
export const getDropRates = async (_req: AuthRequest, res: Response) => {
  try {
    const info = getDropRateInfo();
    return ApiRes.ok(res, info);
  } catch (error: any) {
    LOGGER.error('Get drop rates error:', error.message);
    return ApiRes.serverError(res, 'Failed to get drop rates');
  }
};

/**
 * Get user's chest history
 */
export const getHistory = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return ApiRes.unauthorized(res);

    const { limit = 20 } = req.query;
    const history = await getChestHistory(user._id.toString(), Number(limit));

    return ApiRes.ok(res, { history });
  } catch (error: any) {
    LOGGER.error('Get chest history error:', error.message);
    return ApiRes.serverError(res, 'Failed to get chest history');
  }
};
