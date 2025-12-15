import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { IUpgrades } from '@shared/interface/IUpgrades';
import { ApiRes } from '../utils/response.js';
import { LOGGER } from '../log/logger.js';
import { getAllUpgrades, purchaseUpgrade as purchaseUpgradeService } from '../services/upgrade.service.js';
import { UPGRADE_TYPES } from '../config/upgrade.config.js';

export const getUpgrades = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return ApiRes.unauthorized(res);

    const data = getAllUpgrades(user);
    return ApiRes.ok(res, data);
  } catch (error: any) {
    LOGGER.error('Get upgrades error:', error.message);
    return ApiRes.serverError(res, 'Failed to get upgrades');
  }
};

export const purchaseUpgrade = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return ApiRes.unauthorized(res);

    const { type } = req.params as { type: keyof IUpgrades };

    if (!type || !UPGRADE_TYPES.includes(type)) {
      return ApiRes.badRequest(res, 'Invalid upgrade type');
    }

    const data = await purchaseUpgradeService(user, type);
    return ApiRes.ok(res, data);
  } catch (error: any) {
    LOGGER.error('Purchase upgrade error:', error.message);
    const message = error.message || 'Failed to purchase upgrade';
    return ApiRes.badRequest(res, message);
  }
};
