import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { ApiRes } from '../utils/response.js';
import { LOGGER } from '../log/logger.js';
import { createSoloGame, finishSoloGame as finishSoloGameService, getLeaderboard as getLeaderboardService, getPlayerStats as getPlayerStatsService } from '../services/runner.service.js';
import { getLeaderboardRewardInfo } from '../services/leaderboard.service.js';

export const startSoloGame = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return ApiRes.unauthorized(res);

    const data = await createSoloGame(user);
    return ApiRes.ok(res, data);
  } catch (error: any) {
    LOGGER.error('Start solo game error:', error.message);
    return ApiRes.serverError(res, 'Failed to start game');
  }
};

export const finishSoloGame = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return ApiRes.unauthorized(res);

    const { gameId, result } = req.body;

    const data = await finishSoloGameService(user, gameId, result);
    return ApiRes.ok(res, data);
  } catch (error: any) {
    LOGGER.error('Finish solo game error:', error.message);
    if (error.message.includes('Invalid') || error.message.includes('Unauthorized')) {
      return ApiRes.badRequest(res, error.message);
    }
    return ApiRes.serverError(res, 'Failed to finish game');
  }
};

export const getLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 100 } = req.query;
    const userId = req.user?._id?.toString();

    const leaderboardData = await getLeaderboardService(userId, Number(limit));
    const rewardInfo = getLeaderboardRewardInfo();

    return ApiRes.ok(res, {
      ...leaderboardData,
      rewardInfo
    });
  } catch (error: any) {
    LOGGER.error('Get leaderboard error:', error.message);
    return ApiRes.serverError(res, 'Failed to get leaderboard');
  }
};

export const getPlayerStats = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return ApiRes.unauthorized(res);

    const data = await getPlayerStatsService(user);
    return ApiRes.ok(res, data);
  } catch (error: any) {
    LOGGER.error('Get player stats error:', error.message);
    return ApiRes.serverError(res, 'Failed to get stats');
  }
};
