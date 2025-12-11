import { Request, Response } from 'express';
import { Achievement } from '../models/Achievement.js';
import { User } from '../models/Users.js';
import { Transaction } from '../models/Transactions.js';

/**
 * Get all achievements with user progress
 */
export async function getAchievements(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    // Get all active achievements
    const achievements = await Achievement.find({ active: true }).sort({ tier: 1, order: 1 });

    // Merge with user progress
    const achievementsWithProgress = achievements.map(achievement => {
      const userAchievement = user.achievements.find((a: any) => a.achievementId === achievement.achievementId);
      return {
        ...achievement.toObject(),
        progress: userAchievement?.progress || 0,
        unlocked: userAchievement?.unlocked || false,
        unlockedAt: userAchievement?.unlockedAt
      };
    });

    // Calculate unlock percentage
    const totalAchievements = achievements.length;
    const unlockedCount = achievementsWithProgress.filter(a => a.unlocked).length;
    const unlockPercentage = totalAchievements > 0 ? Math.floor((unlockedCount / totalAchievements) * 100) : 0;

    res.json({
      success: true,
      data: {
        achievements: achievementsWithProgress,
        stats: {
          total: totalAchievements,
          unlocked: unlockedCount,
          percentage: unlockPercentage
        }
      }
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ success: false, error: 'Failed to get achievements' });
  }
}

/**
 * Update achievement progress (called internally from game/upgrade controllers)
 */
export async function updateAchievementProgress(userId: string, updateData: {
  gamesPlayed?: number;
  gamesWon?: number;
  totalCoins?: number;
  totalDistance?: number;
  highestArmy?: number;
  bestScore?: number;
  upgradeType?: string;
  upgradeLevel?: number;
}) {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    // Get all active achievements
    const achievements = await Achievement.find({ active: true });

    const newlyUnlocked: any[] = [];

    for (const achievement of achievements) {
      // Find or create user achievement
      let userAchievement = user.achievements.find((a: any) => a.achievementId === achievement.achievementId);
      if (!userAchievement) {
        userAchievement = {
          achievementId: achievement.achievementId,
          progress: 0,
          unlocked: false
        };
        user.achievements.push(userAchievement as any);
      }

      // Skip if already unlocked
      if (userAchievement.unlocked) continue;

      // Update progress based on requirement type
      let newProgress = userAchievement.progress;
      switch (achievement.requirement.type) {
        case 'games_played':
          if (updateData.gamesPlayed !== undefined) {
            newProgress = updateData.gamesPlayed;
          }
          break;
        case 'games_won':
          if (updateData.gamesWon !== undefined) {
            newProgress = updateData.gamesWon;
          }
          break;
        case 'total_coins':
          if (updateData.totalCoins !== undefined) {
            newProgress = updateData.totalCoins;
          }
          break;
        case 'total_distance':
          if (updateData.totalDistance !== undefined) {
            newProgress = updateData.totalDistance;
          }
          break;
        case 'highest_army':
          if (updateData.highestArmy !== undefined) {
            newProgress = Math.max(newProgress, updateData.highestArmy);
          }
          break;
        case 'best_score':
          if (updateData.bestScore !== undefined) {
            newProgress = Math.max(newProgress, updateData.bestScore);
          }
          break;
        case 'upgrade_level':
          if (updateData.upgradeType === achievement.requirement.upgradeType && updateData.upgradeLevel !== undefined) {
            newProgress = updateData.upgradeLevel;
          }
          break;
      }

      userAchievement.progress = newProgress;

      // Check if unlocked
      if (newProgress >= achievement.requirement.target && !userAchievement.unlocked) {
        userAchievement.unlocked = true;
        userAchievement.unlockedAt = new Date();
        newlyUnlocked.push(achievement);
      }
    }

    await user.save();

    // Give rewards for newly unlocked achievements
    for (const achievement of newlyUnlocked) {
      if (achievement.reward.coins) {
        user.coins += achievement.reward.coins;
        await Transaction.create({
          userId: user._id,
          type: 'achievement_reward',
          currency: 'coins',
          amount: achievement.reward.coins,
          balanceBefore: user.coins - achievement.reward.coins,
          balanceAfter: user.coins,
          description: `Achievement unlocked: ${achievement.name}`,
          relatedAchievementId: achievement.achievementId
        });
      }

      if (achievement.reward.gems) {
        user.gems += achievement.reward.gems;
        await Transaction.create({
          userId: user._id,
          type: 'achievement_reward',
          currency: 'gems',
          amount: achievement.reward.gems,
          balanceBefore: user.gems - achievement.reward.gems,
          balanceAfter: user.gems,
          description: `Achievement unlocked: ${achievement.name}`,
          relatedAchievementId: achievement.achievementId
        });
      }

      await user.save();
      console.log(`Achievement unlocked for user ${userId}: ${achievement.name}`);
    }

    return newlyUnlocked;
  } catch (error) {
    console.error('Update achievement progress error:', error);
    return [];
  }
}
