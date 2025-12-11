import { Request, Response } from 'express';
import { User } from '../models/Users.js';
import { generateToken, AuthRequest } from '../middleware/authMiddleware.js';

/**
 * Google OAuth authentication (ONLY AUTH METHOD)
 *
 * Expected request body:
 * {
 *   googleId: string,
 *   email: string,
 *   username: string,
 *   avatar?: string
 * }
 */
export async function googleAuth(req: Request, res: Response) {
  try {
    const { googleId, email, username, avatar } = req.body;

    // Validate required fields
    if (!googleId || !email) {
      return res.status(400).json({
        success: false,
        error: 'Google ID and email are required'
      });
    }

    // Find or create user
    let user = await User.findOne({ googleId });

    if (!user) {
      // Check if email is already used (edge case)
      const existingEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          error: 'Email already registered with different account'
        });
      }

      // Create new user
      user = new User({
        googleId,
        email: email.toLowerCase(),
        username: username || `user_${googleId.substring(0, 8)}`,
        avatar: avatar || undefined
      });

      await user.save();

      console.log(`New user created via Google OAuth: ${user.username} (${user.email})`);
    } else {
      // Update avatar if provided and changed
      if (avatar && user.avatar !== avatar) {
        user.avatar = avatar;
        await user.save();
      }
    }

    // Generate JWT token
    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          coins: user.coins,
          gems: user.gems
        }
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        coins: user.coins,
        gems: user.gems,
        upgrades: user.upgrades,
        stats: {
          gamesPlayed: user.gamesPlayed,
          gamesWon: user.gamesWon,
          totalDistance: user.totalDistance,
          totalCoinsCollected: user.totalCoinsCollected,
          highestArmy: user.highestArmy,
          bestScore: user.bestScore
        },
        currentSkin: user.currentSkin,
        ownedSkins: user.ownedSkins,
        settings: user.settings,
        dailyMissions: user.dailyMissions,
        weeklyMissions: user.weeklyMissions,
        achievements: user.achievements,
        activeBoosts: user.activeBoosts
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user data'
    });
  }
}

/**
 * Logout (client-side should clear token)
 */
export async function logout(req: AuthRequest, res: Response) {
  // JWT is stateless, so logout is handled client-side by removing token
  // This endpoint exists for consistency and future session management
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}
