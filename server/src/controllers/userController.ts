import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { ApiRes } from '../utils/response.js';
import { LOGGER } from '../log/logger.js';
import { updateUserData } from '../services/user.service.js';
import { User } from '../models/Users.js';

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return ApiRes.unauthorized(res);

    // Fetch fresh user data from database
    const freshUser = await User.findById(user._id);
    if (!freshUser) {
      return ApiRes.notFound(res, 'User not found');
    }

    return ApiRes.ok(res, freshUser);
  } catch (error: any) {
    LOGGER.error('Get user error:', error.message);
    return ApiRes.serverError(res, 'Failed to get user');
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return ApiRes.unauthorized(res);

    const userId = user._id.toString();

    const data = await updateUserData(userId, req.body);
    return ApiRes.ok(res, data);
  } catch (error: any) {
    LOGGER.error('Update user error:', error.message);
    if (error.message === 'User not found') {
      return ApiRes.notFound(res, error.message);
    }
    return ApiRes.serverError(res, 'Failed to update user');
  }
};
