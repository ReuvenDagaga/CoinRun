import { Request, Response } from 'express';
import { ApiRes } from '../utils/response.js';
import { LOGGER } from '../log/logger.js';
import { getUserSettings, updateUserSettings } from '../services/settings.service.js';

export const getSettings = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return ApiRes.unauthorized(res);

    const data = getUserSettings(user);
    return ApiRes.ok(res, data);
  } catch (error: any) {
    LOGGER.error('Get settings error:', error.message);
    return ApiRes.serverError(res, 'Failed to get settings');
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return ApiRes.unauthorized(res);

    const data = await updateUserSettings(user, req.body);
    return ApiRes.ok(res, data);
  } catch (error: any) {
    LOGGER.error('Update settings error:', error.message);
    if (error.message.includes('must be') || error.message.includes('Invalid')) {
      return ApiRes.badRequest(res, error.message);
    }
    return ApiRes.serverError(res, 'Failed to update settings');
  }
};
