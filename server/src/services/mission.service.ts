import { Mission } from '../models/Mission.js';
import { User } from '../models/Users.js';
import { Transaction } from '../models/Transactions.js';
import { LOGGER } from '../log/logger.js';

export const getAllMissions = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const dailyMissions = await Mission.find({ type: 'daily', active: true }).sort({ order: 1 });
  const weeklyMissions = await Mission.find({ type: 'weekly', active: true }).sort({ order: 1 });

  const dailyWithProgress = dailyMissions.map(mission => {
    const userMission = user.dailyMissions.find((m: any) => m.missionId === mission.missionId);
    return {
      ...mission.toObject(),
      progress: userMission?.progress || 0,
      completed: userMission?.completed || false,
      claimed: userMission?.claimed || false
    };
  });

  const weeklyWithProgress = weeklyMissions.map(mission => {
    const userMission = user.weeklyMissions.find((m: any) => m.missionId === mission.missionId);
    return {
      ...mission.toObject(),
      progress: userMission?.progress || 0,
      completed: userMission?.completed || false,
      claimed: userMission?.claimed || false
    };
  });

  const now = new Date();
  const dailyReset = new Date(now);
  dailyReset.setUTCHours(24, 0, 0, 0);
  const dailyResetIn = dailyReset.getTime() - now.getTime();

  const weeklyReset = new Date(now);
  const daysUntilMonday = (8 - weeklyReset.getUTCDay()) % 7 || 7;
  weeklyReset.setUTCDate(weeklyReset.getUTCDate() + daysUntilMonday);
  weeklyReset.setUTCHours(0, 0, 0, 0);
  const weeklyResetIn = weeklyReset.getTime() - now.getTime();

  return {
    daily: dailyWithProgress,
    weekly: weeklyWithProgress,
    dailyResetIn,
    weeklyResetIn
  };
};

export const claimMissionReward = async (userId: string, missionId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  if (!missionId) throw new Error('Mission ID required');

  const mission = await Mission.findOne({ missionId, active: true });
  if (!mission) throw new Error('Mission not found');

  const missionArray = mission.type === 'daily' ? user.dailyMissions : user.weeklyMissions;
  const userMission = missionArray.find((m: any) => m.missionId === missionId);

  if (!userMission) throw new Error('Mission not started');
  if (!userMission.completed) throw new Error('Mission not completed');
  if (userMission.claimed) throw new Error('Reward already claimed');

  const coinsBefore = user.coins;
  const gemsBefore = user.gems;

  if (mission.reward.coins) {
    user.coins += mission.reward.coins;
  }
  if (mission.reward.gems) {
    user.gems += mission.reward.gems;
  }

  userMission.claimed = true;
  await user.save();

  if (mission.reward.coins) {
    await Transaction.create({
      userId: user._id,
      type: 'mission_reward',
      currency: 'coins',
      amount: mission.reward.coins,
      balanceBefore: coinsBefore,
      balanceAfter: user.coins,
      description: `Mission reward: ${mission.title}`,
      relatedMissionId: missionId
    });
  }

  if (mission.reward.gems) {
    await Transaction.create({
      userId: user._id,
      type: 'mission_reward',
      currency: 'gems',
      amount: mission.reward.gems,
      balanceBefore: gemsBefore,
      balanceAfter: user.gems,
      description: `Mission reward: ${mission.title}`,
      relatedMissionId: missionId
    });
  }

  LOGGER.info(`User ${userId} claimed mission: ${mission.title}`);

  return {
    reward: mission.reward,
    balance: { coins: user.coins, gems: user.gems }
  };
};

export const updateMissionProgress = async (userId: string, updateData: {
  gamesPlayed?: number;
  coinsCollected?: number;
  maxArmy?: number;
  didFinish?: boolean;
  timeTaken?: number;
  totalCoins?: number;
}) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const missions = await Mission.find({ active: true });

    for (const userMission of user.dailyMissions) {
      const mission = missions.find(m => m.missionId === userMission.missionId && m.type === 'daily');
      if (!mission || userMission.completed) continue;

      switch (mission.requirement.type) {
        case 'play_games':
          if (updateData.gamesPlayed) {
            userMission.progress += updateData.gamesPlayed;
          }
          break;
        case 'collect_coins':
          if (updateData.coinsCollected) {
            userMission.progress = Math.max(userMission.progress, updateData.coinsCollected);
          }
          break;
        case 'reach_army':
          if (updateData.maxArmy) {
            userMission.progress = Math.max(userMission.progress, updateData.maxArmy);
          }
          break;
        case 'complete_without_hit':
          if (updateData.didFinish) {
            userMission.progress = 1;
          }
          break;
        case 'finish_under_time':
          if (updateData.didFinish && updateData.timeTaken && updateData.timeTaken <= mission.requirement.target) {
            userMission.progress = 1;
          }
          break;
        case 'collect_total_coins':
          if (updateData.totalCoins) {
            userMission.progress = updateData.totalCoins;
          }
          break;
      }

      if (userMission.progress >= mission.requirement.target) {
        userMission.completed = true;
      }
    }

    for (const userMission of user.weeklyMissions) {
      const mission = missions.find(m => m.missionId === userMission.missionId && m.type === 'weekly');
      if (!mission || userMission.completed) continue;

      switch (mission.requirement.type) {
        case 'play_games':
          if (updateData.gamesPlayed) {
            userMission.progress += updateData.gamesPlayed;
          }
          break;
        case 'collect_coins':
          if (updateData.coinsCollected) {
            userMission.progress = Math.max(userMission.progress, updateData.coinsCollected);
          }
          break;
        case 'reach_army':
          if (updateData.maxArmy) {
            userMission.progress = Math.max(userMission.progress, updateData.maxArmy);
          }
          break;
        case 'complete_without_hit':
          if (updateData.didFinish) {
            userMission.progress = 1;
          }
          break;
        case 'finish_under_time':
          if (updateData.didFinish && updateData.timeTaken && updateData.timeTaken <= mission.requirement.target) {
            userMission.progress = 1;
          }
          break;
        case 'collect_total_coins':
          if (updateData.totalCoins) {
            userMission.progress = updateData.totalCoins;
          }
          break;
      }

      if (userMission.progress >= mission.requirement.target) {
        userMission.completed = true;
      }
    }

    await user.save();
  } catch (error: any) {
    LOGGER.error('Update mission progress error:', error.message);
  }
};

export const resetDailyMissions = async () => {
  try {
    const missions = await Mission.find({ type: 'daily', active: true });

    await User.updateMany({}, {
      $set: {
        dailyMissions: missions.map(m => ({
          missionId: m.missionId,
          progress: 0,
          completed: false,
          claimed: false
        })),
        lastDailyReset: new Date()
      }
    });

    LOGGER.info('Daily missions reset successfully');
  } catch (error: any) {
    LOGGER.error('Reset daily missions error:', error.message);
  }
};

export const resetWeeklyMissions = async () => {
  try {
    const missions = await Mission.find({ type: 'weekly', active: true });

    await User.updateMany({}, {
      $set: {
        weeklyMissions: missions.map(m => ({
          missionId: m.missionId,
          progress: 0,
          completed: false,
          claimed: false
        })),
        lastWeeklyReset: new Date()
      }
    });

    LOGGER.info('Weekly missions reset successfully');
  } catch (error: any) {
    LOGGER.error('Reset weekly missions error:', error.message);
  }
};
