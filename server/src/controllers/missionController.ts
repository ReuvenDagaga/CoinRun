import { Request, Response } from 'express';
import { ApiRes } from '../utils/response.js';
import { LOGGER } from '../log/logger.js';
import { getAllMissions, claimMissionReward } from '../services/mission.service.js';

export const getMissions = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return ApiRes.unauthorized(res);

    const data = await getAllMissions(user._id.toString());
    return ApiRes.ok(res, data);
  } catch (error: any) {
    LOGGER.error('Get missions error:', error.message);
    return ApiRes.serverError(res, 'Failed to get missions');
  }
};

export const claimMission = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return ApiRes.unauthorized(res);

    const { missionId } = req.body;

    const data = await claimMissionReward(user._id.toString(), missionId);
    return ApiRes.ok(res, data);
  } catch (error: any) {
    LOGGER.error('Claim mission error:', error.message);
    if (error.message.includes('not found') || error.message.includes('not started')) {
      return ApiRes.notFound(res, error.message);
    }
    if (error.message.includes('required') || error.message.includes('not completed') || error.message.includes('already claimed')) {
      return ApiRes.badRequest(res, error.message);
    }
    return ApiRes.serverError(res, 'Failed to claim mission');
  }
};

export { updateMissionProgress, resetDailyMissions, resetWeeklyMissions } from '../services/mission.service.js';
