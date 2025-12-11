import { Request, Response } from 'express';
import { Mission } from '../models/Mission.js';
import { User } from '../models/Users.js';
import { Transaction } from '../models/Transactions.js';

/**
 * Get all missions (daily and weekly) with user progress
 */
export async function getMissions(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    // Get all active missions
    const dailyMissions = await Mission.find({ type: 'daily', active: true }).sort({ order: 1 });
    const weeklyMissions = await Mission.find({ type: 'weekly', active: true }).sort({ order: 1 });

    // Merge with user progress
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

    // Calculate time until reset
    const now = new Date();
    const dailyReset = new Date(now);
    dailyReset.setUTCHours(24, 0, 0, 0); // Next midnight UTC
    const dailyResetIn = dailyReset.getTime() - now.getTime();

    const weeklyReset = new Date(now);
    const daysUntilMonday = (8 - weeklyReset.getUTCDay()) % 7 || 7;
    weeklyReset.setUTCDate(weeklyReset.getUTCDate() + daysUntilMonday);
    weeklyReset.setUTCHours(0, 0, 0, 0);
    const weeklyResetIn = weeklyReset.getTime() - now.getTime();

    res.json({
      success: true,
      data: {
        daily: dailyWithProgress,
        weekly: weeklyWithProgress,
        dailyResetIn,
        weeklyResetIn
      }
    });
  } catch (error) {
    console.error('Get missions error:', error);
    res.status(500).json({ success: false, error: 'Failed to get missions' });
  }
}

/**
 * Claim mission reward
 */
export async function claimMission(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { missionId } = req.body;
    if (!missionId) {
      return res.status(400).json({ success: false, error: 'Mission ID required' });
    }

    // Get mission
    const mission = await Mission.findOne({ missionId, active: true });
    if (!mission) {
      return res.status(404).json({ success: false, error: 'Mission not found' });
    }

    // Find user mission
    const missionArray = mission.type === 'daily' ? user.dailyMissions : user.weeklyMissions;
    const userMission = missionArray.find((m: any) => m.missionId === missionId);

    if (!userMission) {
      return res.status(404).json({ success: false, error: 'Mission not started' });
    }

    if (!userMission.completed) {
      return res.status(400).json({ success: false, error: 'Mission not completed' });
    }

    if (userMission.claimed) {
      return res.status(400).json({ success: false, error: 'Reward already claimed' });
    }

    // Give rewards
    const coinsBefore = user.coins;
    const gemsBefore = user.gems;

    if (mission.reward.coins) {
      user.coins += mission.reward.coins;
    }
    if (mission.reward.gems) {
      user.gems += mission.reward.gems;
    }

    // Mark as claimed
    userMission.claimed = true;
    await user.save();

    // Create transaction records
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

    res.json({
      success: true,
      data: {
        reward: mission.reward,
        balance: {
          coins: user.coins,
          gems: user.gems
        }
      }
    });
  } catch (error) {
    console.error('Claim mission error:', error);
    res.status(500).json({ success: false, error: 'Failed to claim mission' });
  }
}

/**
 * Update mission progress (called internally from game controller)
 */
export async function updateMissionProgress(userId: string, updateData: {
  gamesPlayed?: number;
  coinsCollected?: number;
  maxArmy?: number;
  didFinish?: boolean;
  timeTaken?: number;
  totalCoins?: number;
}) {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    // Get all active missions
    const missions = await Mission.find({ active: true });

    // Update daily missions
    for (const userMission of user.dailyMissions) {
      const mission = missions.find(m => m.missionId === userMission.missionId && m.type === 'daily');
      if (!mission || userMission.completed) continue;

      // Update progress based on requirement type
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

      // Check if completed
      if (userMission.progress >= mission.requirement.target) {
        userMission.completed = true;
      }
    }

    // Update weekly missions (same logic)
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
  } catch (error) {
    console.error('Update mission progress error:', error);
  }
}

/**
 * Reset daily missions (run at midnight UTC)
 */
export async function resetDailyMissions() {
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

    console.log('Daily missions reset successfully');
  } catch (error) {
    console.error('Reset daily missions error:', error);
  }
}

/**
 * Reset weekly missions (run at Monday midnight UTC)
 */
export async function resetWeeklyMissions() {
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

    console.log('Weekly missions reset successfully');
  } catch (error) {
    console.error('Reset weekly missions error:', error);
  }
}
