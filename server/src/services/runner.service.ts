import { IUser } from "@shared/interface/IUser";
import { RunnerGame } from "../models/RunnerGame.js";
import { Transaction } from "../models/Transactions.js";
import { User } from "../models/Users.js";
import { LOGGER } from "../log/logger.js";
import { updateMissionProgress } from "./mission.service.js";
import { updateAchievementProgress } from "./achievement.service.js";

const TRACK_LENGTH = 800;
const PLAYER_BASE_SPEED = 50;
const MAX_SPEED_MULTIPLIER = 3;
const MAX_ARMY_BASE = 30;
const MAX_COINS_PER_METER = 2;

export const createSoloGame = async (user: IUser) => {
  const trackSeed = `${Date.now()}-${user._id}-${Math.random().toString(36).substring(2, 9)}`;
  const difficulty = Math.min(1 + user.gamesPlayed / 20, 5);

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

  const game = new RunnerGame({
    gameType: 'solo',
    userId: user._id,
    trackSeed,
    trackDifficulty: difficulty,
    upgradeLevels,
    status: 'in_progress'
  });

  await game.save();

  LOGGER.info(`User ${user._id} started solo game ${game._id}`);

  return {
    gameId: game._id,
    trackSeed,
    difficulty,
    upgrades: upgradeLevels
  };
};

const validateGameResults = (result: any, upgradeLevels: any): { valid: boolean; reason?: string } => {
  const maxCoins = TRACK_LENGTH * MAX_COINS_PER_METER;
  if (result.coinsCollected > maxCoins) {
    return { valid: false, reason: 'Coins collected exceeds maximum possible' };
  }

  if (result.distanceTraveled > TRACK_LENGTH * 1.1) {
    return { valid: false, reason: 'Distance exceeds track length' };
  }

  const maxSpeed = PLAYER_BASE_SPEED * MAX_SPEED_MULTIPLIER;
  const minTime = TRACK_LENGTH / maxSpeed;
  if (result.didFinish && result.timeTaken < minTime * 0.8) {
    return { valid: false, reason: 'Completion time too fast' };
  }

  const maxArmy = MAX_ARMY_BASE + upgradeLevels.capacity * 2;
  if (result.maxArmy > maxArmy) {
    return { valid: false, reason: 'Max army exceeds capacity' };
  }

  if (result.coinsCollected < 0 || result.distanceTraveled < 0 || result.timeTaken < 0 || result.maxArmy < 0) {
    return { valid: false, reason: 'Negative values detected' };
  }

  return { valid: true };
};

export const finishSoloGame = async (user: IUser, gameId: string, result: any) => {
  if (!result || typeof result.finalScore !== 'number') {
    throw new Error('Invalid result data');
  }

  const game = await RunnerGame.findById(gameId);
  if (!game || game.status !== 'in_progress') {
    throw new Error('Invalid game');
  }

  if (game.userId.toString() !== user._id.toString()) {
    throw new Error('Unauthorized');
  }

  const validation = validateGameResults(result, game.upgradeLevels);
  if (!validation.valid) {
    LOGGER.warn(`Anti-cheat triggered for user ${user._id}: ${validation.reason}`);
    throw new Error(validation.reason || 'Invalid game results');
  }

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

  const incomeMultiplier = 1 + game.upgradeLevels.income * 0.01;
  const baseReward = 50 +
    result.coinsCollected +
    result.maxArmy * 2 +
    Math.max(0, (120 - result.timeTaken) * 2) +
    (result.enemiesKilled || 0) * 5;

  const coinReward = Math.floor(baseReward * incomeMultiplier);

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

  await updateMissionProgress(user._id.toString(), {
    gamesPlayed: 1,
    coinsCollected: result.coinsCollected,
    maxArmy: result.maxArmy,
    didFinish: result.didFinish,
    timeTaken: result.timeTaken,
    totalCoins: user.totalCoinsCollected
  });

  const unlockedAchievements = await updateAchievementProgress(user._id.toString(), {
    gamesPlayed: user.gamesPlayed,
    gamesWon: user.gamesWon,
    totalCoins: user.totalCoinsCollected,
    totalDistance: user.totalDistance,
    highestArmy: user.highestArmy,
    bestScore: user.bestScore
  });

  LOGGER.info(`User ${user._id} finished game ${game._id} - Reward: ${coinReward} coins`);

  return {
    reward: { coins: coinReward },
    newBalance: { coins: user.coins, gems: user.gems },
    stats: {
      gamesPlayed: user.gamesPlayed,
      gamesWon: user.gamesWon,
      bestScore: user.bestScore
    },
    unlockedAchievements: unlockedAchievements || []
  };
};

// Calculate power level from upgrades (same formula as in Users model)
const calculatePowerLevel = (upgrades: any): number => {
  return (
    (upgrades.capacity || 0) * 10 +
    (upgrades.addWarrior || 0) * 20 +
    (upgrades.warriorUpgrade || 0) * 10 +
    (upgrades.income || 0) * 5 +
    (upgrades.speed || 0) * 8 +
    (upgrades.jump || 0) * 6 +
    (upgrades.bulletPower || 0) * 12 +
    (upgrades.magnetRadius || 0) * 5
  );
};

export const getLeaderboard = async (userId?: string, limit: number = 100) => {
  // Get top 100 players by power level
  const topPlayers = await User.aggregate([
    {
      $addFields: {
        powerLevel: {
          $add: [
            { $multiply: [{ $ifNull: ['$upgrades.capacity', 0] }, 10] },
            { $multiply: [{ $ifNull: ['$upgrades.addWarrior', 0] }, 20] },
            { $multiply: [{ $ifNull: ['$upgrades.warriorUpgrade', 0] }, 10] },
            { $multiply: [{ $ifNull: ['$upgrades.income', 0] }, 5] },
            { $multiply: [{ $ifNull: ['$upgrades.speed', 0] }, 8] },
            { $multiply: [{ $ifNull: ['$upgrades.jump', 0] }, 6] },
            { $multiply: [{ $ifNull: ['$upgrades.bulletPower', 0] }, 12] },
            { $multiply: [{ $ifNull: ['$upgrades.magnetRadius', 0] }, 5] }
          ]
        }
      }
    },
    { $sort: { powerLevel: -1 } },
    { $limit: Number(limit) },
    {
      $project: {
        _id: 1,
        username: 1,
        avatar: 1,
        powerLevel: 1,
        currentSkin: 1
      }
    }
  ]);

  const leaderboard = topPlayers.map((entry, index) => ({
    rank: index + 1,
    oderId: entry._id.toString(),
    username: entry.username,
    avatar: entry.avatar || null,
    powerLevel: entry.powerLevel,
    skin: entry.currentSkin
  }));

  // If userId provided, find their rank if not in top 100
  let currentUserEntry = null;
  if (userId) {
    const userInTop = leaderboard.find(e => e.oderId === userId);

    if (!userInTop) {
      // Get user's power level and count how many are above them
      const user = await User.findById(userId);
      if (user) {
        const userPowerLevel = calculatePowerLevel(user.upgrades);

        const countAbove = await User.countDocuments({
          $expr: {
            $gt: [
              {
                $add: [
                  { $multiply: [{ $ifNull: ['$upgrades.capacity', 0] }, 10] },
                  { $multiply: [{ $ifNull: ['$upgrades.addWarrior', 0] }, 20] },
                  { $multiply: [{ $ifNull: ['$upgrades.warriorUpgrade', 0] }, 10] },
                  { $multiply: [{ $ifNull: ['$upgrades.income', 0] }, 5] },
                  { $multiply: [{ $ifNull: ['$upgrades.speed', 0] }, 8] },
                  { $multiply: [{ $ifNull: ['$upgrades.jump', 0] }, 6] },
                  { $multiply: [{ $ifNull: ['$upgrades.bulletPower', 0] }, 12] },
                  { $multiply: [{ $ifNull: ['$upgrades.magnetRadius', 0] }, 5] }
                ]
              },
              userPowerLevel
            ]
          }
        });

        currentUserEntry = {
          rank: countAbove + 1,
          oderId: user._id.toString(),
          username: user.username,
          avatar: user.avatar || null,
          powerLevel: userPowerLevel,
          skin: user.currentSkin
        };
      }
    }
  }

  return {
    leaderboard,
    currentUser: currentUserEntry
  };
};

export const getPlayerStats = async (user: IUser) => {
  const recentGames = await RunnerGame.find({
    userId: user._id,
    status: 'finished'
  })
    .sort({ finishedAt: -1 })
    .limit(10)
    .select('gameType finalScore didFinish coinsCollected maxArmy distanceTraveled finishedAt');

  return {
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
  };
};
