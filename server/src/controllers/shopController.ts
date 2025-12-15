import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { ApiRes } from '../utils/response.js';
import { LOGGER } from '../log/logger.js';
import { getAllSkins, purchaseSkin, equipSkinService, openLootbox } from '../services/shop.service.js';

export const getSkins = async (req: AuthRequest, res: Response) => {
  try {
    const skinsData = getAllSkins(req.user);
    return ApiRes.ok(res, skinsData);
  } catch (error: any) {
    LOGGER.error('Get skins error:', error.message);
    return ApiRes.serverError(res, 'Failed to get skins');
  }
};

export const buySkin = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return ApiRes.unauthorized(res);

    const { skinId } = req.body;
    if (!skinId) return ApiRes.badRequest(res, 'Skin ID is required');

    const data = await purchaseSkin(user, skinId);
    return ApiRes.ok(res, data);
  } catch (error: any) {
    LOGGER.error('Buy skin error:', error.message);
    return ApiRes.badRequest(res, error.message || 'Failed to buy skin');
  }
};

export const equipSkin = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return ApiRes.unauthorized(res);

    const { skinId } = req.body;
    if (!skinId) return ApiRes.badRequest(res, 'Skin ID is required');

    const data = await equipSkinService(user, skinId);
    return ApiRes.ok(res, data);
  } catch (error: any) {
    LOGGER.error('Equip skin error:', error.message);
    return ApiRes.badRequest(res, error.message || 'Failed to equip skin');
  }
};

export const buyLootbox = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return ApiRes.unauthorized(res);

    const { type } = req.body;
    if (!type) return ApiRes.badRequest(res, 'Lootbox type is required');

    const data = await openLootbox(user, type);
    return ApiRes.ok(res, data);
  } catch (error: any) {
    LOGGER.error('Buy lootbox error:', error.message);
    return ApiRes.badRequest(res, error.message || 'Failed to open lootbox');
  }
};
