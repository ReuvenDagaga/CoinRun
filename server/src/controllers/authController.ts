import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { ApiRes } from '../utils/response.js';
import { LOGGER } from '../log/logger.js';
import { OAuth2Client } from 'google-auth-library';
import {
  authenticateWithGoogle,
  formatUserResponse,
  formatFullUserResponse
} from '../service/authService';
import { CONFIG } from 'src/config/enviroments.js';

const googleClient = new OAuth2Client(CONFIG.GOOGLE_CLIENT_ID);

export async function googleAuth(req: Request, res: Response) {
  try {
    const { credential } = req.body;

    if (!credential) {
      return ApiRes.badRequest(res, 'Google credential is required');
    }

    // Verify the Google JWT token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: CONFIG.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.sub || !payload.email) {
      return ApiRes.badRequest(res, 'Invalid Google token');
    }

    // Extract user data from verified token
    const googleData = {
      googleId: payload.sub,
      email: payload.email,
      username: payload.name,
      avatar: payload.picture,
    };

    const { token, user, isNewUser } = await authenticateWithGoogle(googleData);

    const status = isNewUser ? ApiRes.created : ApiRes.ok;

    return status(res, {
      token,
      user: formatUserResponse(user),
      userData: formatFullUserResponse(user),
      isNewUser
    });

  } catch (error: any) {
    if (error.status) {
      return ApiRes.badRequest(res, error.message);
    }
    LOGGER.error('Google auth error:', error.message);
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