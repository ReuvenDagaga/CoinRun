import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { User } from '../models/Users.js';
import { RunnerGame } from '../models/RunnerGame.js';
import { Transaction } from '../models/Transactions.js';

// Start solo game
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

    // Create game record
    const game = new RunnerGame({
      gameType: 'solo',
      trackSeed,
      trackDifficulty: difficulty,
      players: [{ userId: user._id }],
      status: 'in_progress'
    });

    await game.save();

    res.json({
      success: true,
      data: {
        gameId: game._id,
        trackSeed,
        difficulty
      }
    });
  } catch (error) {
    console.error('Start solo game error:', error);
    res.status(500).json({ success: false, error: 'Failed to start game' });
  }
}

// Finish solo game
export async function finishSoloGame(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { gameId, result } = req.body;

    // Find game
    const game = await RunnerGame.findById(gameId);
    if (!game || game.status !== 'in_progress') {
      return res.status(400).json({ success: false, error: 'Invalid game' });
    }

    // Verify player
    const playerIndex = game.players.findIndex(p => p.userId.toString() === user._id.toString());
    if (playerIndex === -1) {
      return res.status(400).json({ success: false, error: 'Player not in game' });
    }

    // Update player result
    game.players[playerIndex] = {
      ...game.players[playerIndex],
      finalScore: result.finalScore,
      coinsCollected: result.coinsCollected,
      maxArmy: result.maxArmy,
      distanceTraveled: result.distanceTraveled,
      timeTaken: result.timeTaken,
      didFinish: result.didFinish,
      enemiesKilled: result.enemiesKilled || 0,
      perfectGates: result.perfectGates || 0
    };

    game.status = 'finished';
    game.finishedAt = new Date();
    game.duration = result.timeTaken;

    await game.save();

    // Calculate rewards
    const incomeMultiplier = 1 + user.upgrades.income * 0.15;
    const baseReward = 50 +
      result.coinsCollected +
      result.maxArmy * 2 +
      Math.max(0, (120 - result.timeTaken) * 2) +
      (result.enemiesKilled || 0) * 5;

    const coinReward = Math.floor(baseReward * incomeMultiplier);

    // Update user stats
    user.gamesPlayed += 1;
    if (result.didFinish) {
      user.gamesWon += 1;
    }
    user.totalDistance += result.distanceTraveled;
    user.totalCoinsCollected += result.coinsCollected;
    user.highestArmy = Math.max(user.highestArmy, result.maxArmy);
    user.coins += coinReward;

    await user.save();

    // Create transaction record
    await Transaction.create({
      userId: user._id,
      type: 'reward',
      currency: 'coins',
      amount: coinReward,
      balanceBefore: user.coins - coinReward,
      balanceAfter: user.coins,
      description: `Solo game reward`,
      relatedGameId: game._id
    });

    res.json({
      success: true,
      data: {
        reward: {
          coins: coinReward,
          xp: Math.floor(result.finalScore / 100)
        },
        newBalance: {
          coins: user.coins,
          gems: user.gems
        },
        stats: {
          gamesPlayed: user.gamesPlayed,
          gamesWon: user.gamesWon
        }
      }
    });
  } catch (error) {
    console.error('Finish solo game error:', error);
    res.status(500).json({ success: false, error: 'Failed to finish game' });
  }
}

// Get leaderboard
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
      { $match: { status: 'finished', ...dateFilter } },
      { $unwind: '$players' },
      {
        $group: {
          _id: '$players.userId',
          highScore: { $max: '$players.finalScore' },
          totalGames: { $sum: 1 },
          totalWins: { $sum: { $cond: ['$players.didFinish', 1, 0] } }
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

// Get player stats
export async function getPlayerStats(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    // Get recent games
    const recentGames = await RunnerGame.find({
      'players.userId': user._id,
      status: 'finished'
    })
      .sort({ finishedAt: -1 })
      .limit(10)
      .select('gameType players finishedAt betAmount winnerId');

    res.json({
      success: true,
      data: {
        stats: {
          gamesPlayed: user.gamesPlayed,
          gamesWon: user.gamesWon,
          winRate: user.gamesPlayed > 0 ? (user.gamesWon / user.gamesPlayed) * 100 : 0,
          totalDistance: user.totalDistance,
          totalCoinsCollected: user.totalCoinsCollected,
          highestArmy: user.highestArmy
        },
        recentGames: recentGames.map(game => {
          const playerResult = game.players.find(p => p.userId.toString() === user._id.toString());
          return {
            gameId: game._id,
            type: game.gameType,
            score: playerResult?.finalScore || 0,
            didFinish: playerResult?.didFinish || false,
            finishedAt: game.finishedAt,
            betAmount: game.betAmount,
            won: game.winnerId?.toString() === user._id.toString()
          };
        })
      }
    });
  } catch (error) {
    console.error('Get player stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
}
