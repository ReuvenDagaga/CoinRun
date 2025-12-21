import mongoose from 'mongoose';
import { User } from '../models/Users.js';
import { Transaction } from '../models/Transactions.js';
import { LeaderboardReward, ILeaderboardReward } from '../models/LeaderboardReward.js';
import { LOGGER } from '../log/logger.js';

// Reward tiers based on rank
const REWARD_TIERS = {
  1: { coins: 1000000, gems: 1000, chest: 'legendary' as const },      // 1st: 1M coins, 1K gems, best chest
  2: { coins: 333333, gems: 333, chest: 'legendary' as const },        // 2nd: ~1/3 of 1st
  3: { coins: 166666, gems: 166, chest: 'legendary' as const },        // 3rd: ~1/2 of 2nd
  top10: { coins: 500, gems: 0, chest: 'simple' as const }             // 4-10: simple chest + 500 coins
};

// Get UTC date at midnight (for reward period tracking)
export const getUTCDateString = (date: Date = new Date()): Date => {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

// Check if rewards were already distributed today
export const wasRewardDistributedToday = async (): Promise<boolean> => {
  const today = getUTCDateString();
  const existing = await LeaderboardReward.findOne({ date: today });
  return !!existing;
};

// Get reward for a specific rank
const getRewardForRank = (rank: number) => {
  if (rank === 1) return REWARD_TIERS[1];
  if (rank === 2) return REWARD_TIERS[2];
  if (rank === 3) return REWARD_TIERS[3];
  if (rank >= 4 && rank <= 10) return REWARD_TIERS.top10;
  return null;
};

// Distribute daily leaderboard rewards
export const distributeLeaderboardRewards = async (): Promise<{
  success: boolean;
  distributed: number;
  date: Date;
}> => {
  const today = getUTCDateString();

  // Check if already distributed
  if (await wasRewardDistributedToday()) {
    LOGGER.info('Leaderboard rewards already distributed today');
    return { success: false, distributed: 0, date: today };
  }

  // Get top 10 players by power level
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
    { $limit: 10 },
    {
      $project: {
        _id: 1,
        username: 1,
        coins: 1,
        gems: 1,
        powerLevel: 1
      }
    }
  ]);

  if (topPlayers.length === 0) {
    LOGGER.info('No players to distribute rewards to');
    return { success: true, distributed: 0, date: today };
  }

  const rewardRecords: ILeaderboardReward['rewards'] = [];

  for (let i = 0; i < topPlayers.length; i++) {
    const player = topPlayers[i];
    const rank = i + 1;
    const reward = getRewardForRank(rank);

    if (!reward) continue;

    // Update user balance
    const user = await User.findById(player._id);
    if (!user) continue;

    const prevCoins = user.coins;
    const prevGems = user.gems;

    user.coins += reward.coins;
    user.gems += reward.gems;
    await user.save();

    // Create transactions
    if (reward.coins > 0) {
      await Transaction.create({
        userId: user._id,
        type: 'leaderboard_reward',
        currency: 'coins',
        amount: reward.coins,
        balanceBefore: prevCoins,
        balanceAfter: user.coins,
        description: `Daily leaderboard reward - Rank #${rank}`,
        metadata: { rank, powerLevel: player.powerLevel }
      });
    }

    if (reward.gems > 0) {
      await Transaction.create({
        userId: user._id,
        type: 'leaderboard_reward',
        currency: 'gems',
        amount: reward.gems,
        balanceBefore: prevGems,
        balanceAfter: user.gems,
        description: `Daily leaderboard reward - Rank #${rank}`,
        metadata: { rank, powerLevel: player.powerLevel }
      });
    }

    rewardRecords.push({
      userId: user._id,
      rank,
      powerLevel: player.powerLevel,
      coins: reward.coins,
      gems: reward.gems,
      chest: reward.chest
    });

    LOGGER.info(`Distributed leaderboard reward to ${user.username} (Rank #${rank}): ${reward.coins} coins, ${reward.gems} gems, ${reward.chest} chest`);
  }

  // Save the reward record
  await LeaderboardReward.create({
    date: today,
    distributedAt: new Date(),
    rewards: rewardRecords
  });

  LOGGER.info(`Leaderboard rewards distributed: ${rewardRecords.length} players`);

  return { success: true, distributed: rewardRecords.length, date: today };
};

// Get next reset time (UTC midnight)
export const getNextResetTime = (): Date => {
  const now = new Date();
  const tomorrow = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  return tomorrow;
};

// Get time remaining until next reset
export const getTimeUntilReset = (): { hours: number; minutes: number; seconds: number } => {
  const now = new Date();
  const nextReset = getNextResetTime();
  const diff = nextReset.getTime() - now.getTime();

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds };
};

// Get reward info for display
export const getLeaderboardRewardInfo = () => {
  return {
    rewards: [
      { rank: 1, coins: REWARD_TIERS[1].coins, gems: REWARD_TIERS[1].gems, chest: REWARD_TIERS[1].chest },
      { rank: 2, coins: REWARD_TIERS[2].coins, gems: REWARD_TIERS[2].gems, chest: REWARD_TIERS[2].chest },
      { rank: 3, coins: REWARD_TIERS[3].coins, gems: REWARD_TIERS[3].gems, chest: REWARD_TIERS[3].chest },
      { rank: '4-10', coins: REWARD_TIERS.top10.coins, gems: REWARD_TIERS.top10.gems, chest: REWARD_TIERS.top10.chest }
    ],
    nextReset: getNextResetTime(),
    timeUntilReset: getTimeUntilReset()
  };
};
