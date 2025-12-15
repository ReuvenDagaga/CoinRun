import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { IUpgrades } from '@shared/interface/IUpgrades';
import { ApiRes } from '../utils/response.js';
import { getAllUpgrades, purchaseUpgrade as purchaseUpgradeService } from '../services/upgrade.service.js';
import { UPGRADE_TYPES } from '../config/upgrade.config.js';

/**
 * Upgrade Controller - handles HTTP requests for upgrade operations
 *
 * Responsibilities:
 * - Parse and validate HTTP requests
 * - Call appropriate service methods
 * - Format HTTP responses
 * - Handle errors and return appropriate status codes
 *
 * This controller is thin - all business logic is in the service!
 */

/**
 * GET /api/upgrades
 * Get all upgrades with costs, power, and affordability info
 */
export const getUpgrades = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return ApiRes.unauthorized(res);

    const data = getAllUpgrades(user);

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get upgrades error:', error);
    return ApiRes.serverError(res, 'Failed to get upgrades');
  }
};

/**
 * POST /api/upgrades/:type
 * Purchase a specific upgrade
 */
export const purchaseUpgrade = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return ApiRes.unauthorized(res);

    const { type } = req.params as { type: keyof IUpgrades };

    // Validate upgrade type
    if (!type || !UPGRADE_TYPES.includes(type)) {
      return ApiRes.badRequest(res, 'Invalid upgrade type');
    }

    try {
      const data = await purchaseUpgradeService(user, type);

      return res.json({
        success: true,
        data
      });
    } catch (error) {
      // Service throws errors with user-friendly messages
      const message = error instanceof Error ? error.message : 'Failed to purchase upgrade';
      return ApiRes.badRequest(res, message);
    }
  } catch (error) {
    console.error('Purchase upgrade error:', error);
    return ApiRes.serverError(res, 'Failed to purchase upgrade');
  }
};
