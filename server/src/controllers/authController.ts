import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { ApiRes } from '../utils/response.js';
import { LOGGER } from '../log/logger.js';
import {
  authenticateWithGoogle,
  formatUserResponse,
  formatFullUserResponse
} from '../service/authService';

export async function googleAuth(req: Request, res: Response) {
  try {
    const { googleId, email, username, avatar } = req.body;

    if (!googleId || !email) return ApiRes.badRequest(res, 'Google ID and email are required');

    const { token, user, isNewUser } = await authenticateWithGoogle({
      googleId,
      email,
      username,
      avatar
    });

    const status = isNewUser ? ApiRes.created : ApiRes.ok;
    
    return status(res, {token, user: formatUserResponse(user)});

  } catch (error: any) {
    if (error.status) {
      return ApiRes.badRequest(res, error.message);
    }
    LOGGER.error('Google auth error:', error);
    return ApiRes.serverError(res, 'Authentication failed');
  }
}

export async function getCurrentUser(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return ApiRes.unauthorized(res);
    
    return ApiRes.ok(res, formatFullUserResponse(req.user));
  } catch (error) {
    LOGGER.error('Get current user error:' + error);
    return ApiRes.serverError(res, 'Failed to get user data');
  }
}

export async function logout(req: AuthRequest, res: Response) {
  return ApiRes.noContent(res);
}