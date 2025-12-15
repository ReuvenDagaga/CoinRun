import { Request, Response } from 'express';
import { ApiRes } from '../utils/response.js';
import { LOGGER } from '../log/logger.js';
import { getAllAchievements } from '../services/achievement.service.js';

export const getAchievements = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return ApiRes.unauthorized(res);

    const data = await getAllAchievements(user._id.toString());
    return ApiRes.ok(res, data);
  } catch (error: any) {
    LOGGER.error('Get achievements error:', error.message);
    return ApiRes.serverError(res, 'Failed to get achievements');
  }
};

export { updateAchievementProgress } from '../services/achievement.service.js';
