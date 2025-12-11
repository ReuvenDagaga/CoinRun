import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { User } from '../models/Users.js';
import { RunnerGame } from '../models/RunnerGame.js';
import { Transaction } from '../models/Transactions.js';
import { updateMissionProgress } from './missionController.js';
import { updateAchievementProgress } from './achievementController.js';

// Game constants for anti-cheat validation
const TRACK_LENGTH = 800; // meters
const PLAYER_BASE_SPEED = 50; // m/s
const MAX_SPEED_MULTIPLIER = 3; // Max realistic speed boost
const MAX_ARMY_BASE = 30; // Base max army
const MAX_COINS_PER_METER = 2; // Generous estimate

/**
 * Start solo game
 */
export async function startSoloGame(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    // Generate track seed
    const trackSeed = `${Date.now()}-${user._id}-${Math.random().toString(36).substring(2, 9)}`;

    // Calculate difficulty based on user stats
    const difficulty = Math.min(1 + user.gamesPlayed / 20, 5);

    // Snapshot of current upgrade levels (for anti-cheat)
    const upgradeLevels = {
      capacity: user.upgrades.capacity,
      addWarrior: user.upgrades.addWarrior,
      warriorUpgrade: user.upgrades.warriorUpgrade,
      income: user.upgrades.income,
      speed: user.upgrades.speed,
      jump: user.upgrades.jump,
      bulletPower: user.upgrades.bulletPower,
      magnetRadius: user.upgrades.magnetRadius
    };

    // Create game record
    const game = new RunnerGame({
      gameType: 'solo',
      userId: user._id,
      trackSeed,
      trackDifficulty: difficulty,
      upgradeLevels,
      status: 'in_progress'
    });

    await game.save();

    res.json({
      success: true,
      data: {
        gameId: game._id,
        trackSeed,
        difficulty,
        upgrades: upgradeLevels
      }
    });
  } catch (error) {
    console.error('Start solo game error:', error);
    res.status(500).json({ success: false, error: 'Failed to start game' });
  }
}

/**
 * Validate game results for anti-cheat
 */
function validateGameResults(result: any, upgradeLevels: any): { valid: boolean; reason?: string } {
  // Max coins based on track length
  const maxCoins = TRACK_LENGTH * MAX_COINS_PER_METER;
  if (result.coinsCollected > maxCoins) {
    return { valid: false, reason: 'Coins collected exceeds maximum possible' };
  }

  // Max distance is track length
  if (result.distanceTraveled > TRACK_LENGTH * 1.1) { // 10% buffer for overshooting
    return { valid: false, reason: 'Distance exceeds track length' };
  }

  // Minimum time based on max possible speed
  const maxSpeed = PLAYER_BASE_SPEED * MAX_SPEED_MULTIPLIER;
  const minTime = TRACK_LENGTH / maxSpeed;
  if (result.didFinish && result.timeTaken < minTime * 0.8) { // 20% buffer
    return { valid: false, reason: 'Completion time too fast' };
  }

  // Max army based on capacity upgrade
  const maxArmy = MAX_ARMY_BASE + upgradeLevels.capacity * 2;
  if (result.maxArmy > maxArmy) {
    return { valid: false, reason: 'Max army exceeds capacity' };
  }

  // Negative values check
  if (result.coinsCollected < 0 || result.distanceTraveled < 0 || result.timeTaken < 0 || result.maxArmy < 0) {
    return { valid: false, reason: 'Negative values detected' };
  }

  return { valid: true };
}

/**
 * Finish solo game
 */
export async function finishSoloGame(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { gameId, result } = req.body;

    // Validate required fields
    if (!result || typeof result.finalScore !== 'number') {
      return res.status(400).json({ success: false, error: 'Invalid result data' });
    }

    // Find game
    const game = await RunnerGame.findById(gameId);
    if (!game || game.status !== 'in_progress') {
      return res.status(400).json({ success: false, error: 'Invalid game' });
    }

    // Verify player
    if (game.userId.toString() !== user._id.toString()) {
      return res.status(400).json({ success: false, error: 'Unauthorized' });
    }

    // Anti-cheat validation
    const validation = validateGameResults(result, game.upgradeLevels);
    if (!validation.valid) {
      console.warn(`Anti-cheat triggered for user ${user._id}: ${validation.reason}`);
      return res.status(400).json({
        success: false,
        error: 'Invalid game results',
        details: validation.reason
      });
    }

    // Update game record
    game.finalScore = result.finalScore || 0;
    game.coinsCollected = result.coinsCollected || 0;
    game.maxArmy = result.maxArmy || 0;
    game.distanceTraveled = result.distanceTraveled || 0;
    game.timeTaken = result.timeTaken || 0;
    game.didFinish = result.didFinish || false;
    game.enemiesKilled = result.enemiesKilled || 0;
    game.perfectGates = result.perfectGates || 0;
    game.status = 'finished';
    game.finishedAt = new Date();
    game.duration = result.timeTaken;

    await game.save();

    // Calculate rewards with income multiplier
    const incomeMultiplier = 1 + game.upgradeLevels.income * 0.01; // 1% per level
    const baseReward = 50 +
      result.coinsCollected +
      result.maxArmy * 2 +
      Math.max(0, (120 - result.timeTaken) * 2) +
      (result.enemiesKilled || 0) * 5;

    const coinReward = Math.floor(baseReward * incomeMultiplier);

    // Update user stats
    const previousCoins = user.coins;
    user.gamesPlayed += 1;
    if (result.didFinish) {
      user.gamesWon += 1;
    }
    user.totalDistance += result.distanceTraveled;
    user.totalCoinsCollected += result.coinsCollected;
    user.highestArmy = Math.max(user.highestArmy, result.maxArmy);
    user.bestScore = Math.max(user.bestScore, result.finalScore);
    user.coins += coinReward;

    await user.save();

    // Create transaction record
    await Transaction.create({
      userId: user._id,
      type: 'game_reward',
      currency: 'coins',
      amount: coinReward,
      balanceBefore: previousCoins,
      balanceAfter: user.coins,
      description: `Solo game reward`,
      relatedGameId: game._id
    });

    // Update mission progress
    await updateMissionProgress(user._id.toString(), {
      gamesPlayed: 1,
      coinsCollected: result.coinsCollected,
      maxArmy: result.maxArmy,
      didFinish: result.didFinish,
      timeTaken: result.timeTaken,
      totalCoins: user.totalCoinsCollected
    });

    // Update achievement progress
    const unlockedAchievements = await updateAchievementProgress(user._id.toString(), {
      gamesPlayed: user.gamesPlayed,
      gamesWon: user.gamesWon,
      totalCoins: user.totalCoinsCollected,
      totalDistance: user.totalDistance,
      highestArmy: user.highestArmy,
      bestScore: user.bestScore
    });

    res.json({
      success: true,
      data: {
        reward: {
          coins: coinReward
        },
        newBalance: {
          coins: user.coins,
          gems: user.gems
        },
        stats: {
          gamesPlayed: user.gamesPlayed,
          gamesWon: user.gamesWon,
          bestScore: user.bestScore
        },
        unlockedAchievements: unlockedAchievements || []
      }
    });
  } catch (error) {
    console.error('Finish solo game error:', error);
    res.status(500).json({ success: false, error: 'Failed to finish game' });
  }
}

/**
 * Get leaderboard
 */
export async function getLeaderboard(req: AuthRequest, res: Response) {
  try {
    const { type = 'daily', limit = 100 } = req.query;

    let dateFilter = {};
    const now = new Date();

    switch (type) {
      case 'daily':
        dateFilter = {
          finishedAt: {
            $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
          }
        };
        break;
      case 'weekly':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFilter = { finishedAt: { $gte: weekAgo } };
        break;
      // 'alltime' has no date filter
    }

    // Aggregate top scores
    const leaderboard = await RunnerGame.aggregate([
      { $match: { status: 'finished', gameType: 'solo', ...dateFilter } },
      {
        $group: {
          _id: '$userId',
          highScore: { $max: '$finalScore' },
          totalGames: { $sum: 1 },
          totalWins: { $sum: { $cond: ['$didFinish', 1, 0] } }
        }
      },
      { $sort: { highScore: -1 } },
      { $limit: Number(limit) },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          username: '$user.username',
          score: '$highScore',
          skin: '$user.currentSkin',
          totalGames: 1,
          winRate: { $multiply: [{ $divide: ['$totalWins', '$totalGames'] }, 100] }
        }
      }
    ]);

    // Add ranks
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      rank: index + 1,
      ...entry
    }));

    res.json({
      success: true,
      data: rankedLeaderboard
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ success: false, error: 'Failed to get leaderboard' });
  }
}

/**
 * Get player stats and game history
 */
export async function getPlayerStats(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    // Get recent games
    const recentGames = await RunnerGame.find({
      userId: user._id,
      status: 'finished'
    })
      .sort({ finishedAt: -1 })
      .limit(10)
      .select('gameType finalScore didFinish coinsCollected maxArmy distanceTraveled finishedAt');

    res.json({
      success: true,
      data: {
        stats: {
          gamesPlayed: user.gamesPlayed,
          gamesWon: user.gamesWon,
          winRate: user.gamesPlayed > 0 ? Math.floor((user.gamesWon / user.gamesPlayed) * 100) : 0,
          totalDistance: user.totalDistance,
          totalCoinsCollected: user.totalCoinsCollected,
          highestArmy: user.highestArmy,
          bestScore: user.bestScore
        },
        recentGames: recentGames.map(game => ({
          gameId: game._id,
          type: game.gameType,
          score: game.finalScore,
          coinsCollected: game.coinsCollected,
          maxArmy: game.maxArmy,
          distance: game.distanceTraveled,
          didFinish: game.didFinish,
          finishedAt: game.finishedAt
        }))
      }
    });
  } catch (error) {
    console.error('Get player stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
}
