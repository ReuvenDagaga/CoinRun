import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../models/Users.js';
import { generateToken, AuthRequest } from '../middleware/authMiddleware.js';

// Register new user
export async function register(req: Request, res: Response) {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || username.length < 3 || username.length > 20) {
      return res.status(400).json({
        success: false,
        error: 'Username must be 3-20 characters'
      });
    }

    // Check if username exists
    const existingUser = await User.findOne({
      $or: [{ username: username.toLowerCase() }, { email: email?.toLowerCase() }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Username or email already exists'
      });
    }

    // Hash password if provided
    let passwordHash;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    // Create user
    const user = new User({
      username,
      email: email?.toLowerCase(),
      passwordHash
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          coins: user.coins,
          gems: user.gems,
          usdtBalance: user.usdtBalance,
          upgrades: user.upgrades,
          stats: {
            gamesPlayed: user.gamesPlayed,
            gamesWon: user.gamesWon,
            totalDistance: user.totalDistance,
            totalCoinsCollected: user.totalCoinsCollected,
            highestArmy: user.highestArmy
          },
          currentSkin: user.currentSkin,
          ownedSkins: user.ownedSkins
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
}

// Login
export async function login(req: Request, res: Response) {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({
      $or: [{ username: username.toLowerCase() }, { email: username.toLowerCase() }]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check password if user has one
    if (user.passwordHash) {
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }
    }

    // Generate token
    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          coins: user.coins,
          gems: user.gems,
          usdtBalance: user.usdtBalance,
          upgrades: user.upgrades,
          stats: {
            gamesPlayed: user.gamesPlayed,
            gamesWon: user.gamesWon,
            totalDistance: user.totalDistance,
            totalCoinsCollected: user.totalCoinsCollected,
            highestArmy: user.highestArmy
          },
          currentSkin: user.currentSkin,
          ownedSkins: user.ownedSkins
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
}

// Google OAuth callback
export async function googleAuth(req: Request, res: Response) {
  try {
    const { googleId, email, name } = req.body;

    // Find or create user
    let user = await User.findOne({ googleId });

    if (!user) {
      // Check if email exists
      user = await User.findOne({ email: email.toLowerCase() });

      if (user) {
        // Link Google account
        user.googleId = googleId;
        await user.save();
      } else {
        // Create new user
        const username = name.replace(/\s+/g, '').substring(0, 15) + Math.random().toString(36).substring(2, 5);

        user = new User({
          username,
          email: email.toLowerCase(),
          googleId
        });

        await user.save();
      }
    }

    // Generate token
    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          coins: user.coins,
          gems: user.gems,
          usdtBalance: user.usdtBalance,
          upgrades: user.upgrades,
          stats: {
            gamesPlayed: user.gamesPlayed,
            gamesWon: user.gamesWon,
            totalDistance: user.totalDistance,
            totalCoinsCollected: user.totalCoinsCollected,
            highestArmy: user.highestArmy
          },
          currentSkin: user.currentSkin,
          ownedSkins: user.ownedSkins
        }
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ success: false, error: 'Authentication failed' });
  }
}

// Get current user
export async function getCurrentUser(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        coins: user.coins,
        gems: user.gems,
        usdtBalance: user.usdtBalance,
        upgrades: user.upgrades,
        stats: {
          gamesPlayed: user.gamesPlayed,
          gamesWon: user.gamesWon,
          totalDistance: user.totalDistance,
          totalCoinsCollected: user.totalCoinsCollected,
          highestArmy: user.highestArmy
        },
        currentSkin: user.currentSkin,
        ownedSkins: user.ownedSkins,
        dailyStreak: user.dailyStreak,
        achievements: user.achievements,
        referralCode: user.referralCode
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, error: 'Failed to get user' });
  }
}

// Logout (client-side only, just return success)
export async function logout(req: AuthRequest, res: Response) {
  res.json({ success: true });
}

// Create or retrieve anonymous user
export async function anonymousAuth(req: Request, res: Response) {
  try {
    const { anonymousId } = req.body;

    // If anonymousId provided, try to find existing user
    if (anonymousId) {
      const existingUser = await User.findOne({ anonymousId });

      if (existingUser) {
        // Update lastActive
        existingUser.lastActive = new Date();
        await existingUser.save();

        const token = generateToken(existingUser._id.toString());

        return res.json({
          success: true,
          data: {
            token,
            anonymousId: existingUser.anonymousId,
            user: formatUserResponse(existingUser)
          }
        });
      }
    }

    // Create new anonymous user
    const newAnonymousId = anonymousId || uuidv4();
    const randomNum = Math.floor(Math.random() * 10000);
    const username = `Guest_${randomNum}`;

    const user = new User({
      username,
      anonymousId: newAnonymousId,
      isAnonymous: true,
      lastActive: new Date()
    });

    await user.save();

    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      data: {
        token,
        anonymousId: newAnonymousId,
        user: formatUserResponse(user)
      }
    });
  } catch (error) {
    console.error('Anonymous auth error:', error);
    res.status(500).json({ success: false, error: 'Authentication failed' });
  }
}

// Upgrade anonymous account to full account
export async function upgradeAnonymousAccount(req: Request, res: Response) {
  try {
    const { anonymousId, googleId, email, name } = req.body;

    if (!anonymousId) {
      return res.status(400).json({
        success: false,
        error: 'Anonymous ID required'
      });
    }

    // Find anonymous user
    const anonUser = await User.findOne({ anonymousId });

    if (!anonUser) {
      return res.status(404).json({
        success: false,
        error: 'Anonymous user not found'
      });
    }

    // Check if email/googleId already linked to another account
    const existingUser = await User.findOne({
      $or: [
        { email: email?.toLowerCase() },
        { googleId }
      ]
    });

    if (existingUser && existingUser._id.toString() !== anonUser._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Email or Google account already linked to another user'
      });
    }

    // Upgrade the anonymous account
    anonUser.isAnonymous = false;
    anonUser.googleId = googleId;
    anonUser.email = email?.toLowerCase();

    // Use Google name if provided, otherwise keep Guest_XXXX
    if (name) {
      const newUsername = name.replace(/\s+/g, '').substring(0, 15) + Math.random().toString(36).substring(2, 5);
      // Check if username is taken
      const usernameExists = await User.findOne({
        username: newUsername,
        _id: { $ne: anonUser._id }
      });
      if (!usernameExists) {
        anonUser.username = newUsername;
      }
    }

    anonUser.anonymousId = undefined as any; // Remove anonymous ID
    anonUser.lastActive = new Date();

    await anonUser.save();

    const token = generateToken(anonUser._id.toString());

    res.json({
      success: true,
      data: {
        token,
        user: formatUserResponse(anonUser)
      }
    });
  } catch (error) {
    console.error('Upgrade anonymous error:', error);
    res.status(500).json({ success: false, error: 'Failed to upgrade account' });
  }
}

// Helper function to format user response
function formatUserResponse(user: any) {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    isAnonymous: user.isAnonymous,
    coins: user.coins,
    gems: user.gems,
    usdtBalance: user.usdtBalance,
    upgrades: user.upgrades,
    stats: {
      gamesPlayed: user.gamesPlayed,
      gamesWon: user.gamesWon,
      totalDistance: user.totalDistance,
      totalCoinsCollected: user.totalCoinsCollected,
      highestArmy: user.highestArmy
    },
    currentSkin: user.currentSkin,
    ownedSkins: user.ownedSkins,
    dailyStreak: user.dailyStreak,
    referralCode: user.referralCode
  };
}
