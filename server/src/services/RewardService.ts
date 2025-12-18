/**
 * Reward Service - Distributes rewards after PvP matches
 * Handles coin payouts and gem rewards
 */
import { User } from '../models/Users.js';
import { GameResult, PVP_CONSTANTS } from '../../../shared/types/pvp.types.js';
import { LOGGER } from '../log/logger.js';

export interface RewardDistribution {
  winnerId: string | null;
  winnerReward: {
    coins: number;
    gems: number;
  };
  loserReward: {
    coins: number;
    gems: number;
  };
}

export class RewardService {
  /**
   * Distribute rewards to both players based on match result
   */
  async distributeRewards(result: GameResult): Promise<RewardDistribution | null> {
    try {
      const { winnerId, player1, player2 } = result;

      // Calculate rewards
      const winnerCoins = Math.floor(PVP_CONSTANTS.ENTRY_FEE * PVP_CONSTANTS.WINNER_MULTIPLIER);
      const winnerGems = PVP_CONSTANTS.WINNER_GEMS;
      const loserGems = PVP_CONSTANTS.LOSER_GEMS;

      const distribution: RewardDistribution = {
        winnerId,
        winnerReward: {
          coins: winnerCoins,
          gems: winnerGems
        },
        loserReward: {
          coins: 0, // Lost entry fee
          gems: loserGems
        }
      };

      // Handle draw (rare case)
      if (!winnerId) {
        // Refund both players
        await this.refundPlayer(player1.userId, PVP_CONSTANTS.ENTRY_FEE);
        await this.refundPlayer(player2.userId, PVP_CONSTANTS.ENTRY_FEE);

        LOGGER.info(`Match draw - refunded both players: ${player1.userId}, ${player2.userId}`);
        return distribution;
      }

      // Determine winner and loser
      const isPlayer1Winner = winnerId === player1.userId;
      const winnerUserId = isPlayer1Winner ? player1.userId : player2.userId;
      const loserUserId = isPlayer1Winner ? player2.userId : player1.userId;

      // Award winner
      await this.rewardWinner(winnerUserId, winnerCoins, winnerGems);

      // Award loser (consolation gems)
      await this.rewardLoser(loserUserId, loserGems);

      // Update stats
      await this.updateMatchStats(winnerUserId, loserUserId);

      LOGGER.info(`Rewards distributed - Winner: ${winnerUserId} (+${winnerCoins} coins, +${winnerGems} gems), Loser: ${loserUserId} (+${loserGems} gems)`);

      return distribution;
    } catch (error: any) {
      LOGGER.error(`Error distributing rewards: ${error.message}`);
      return null;
    }
  }

  /**
   * Reward winner
   */
  private async rewardWinner(userId: string, coins: number, gems: number): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        LOGGER.error(`Winner user not found: ${userId}`);
        return false;
      }

      user.coins += coins;
      user.gems += gems;
      await user.save();

      return true;
    } catch (error: any) {
      LOGGER.error(`Error rewarding winner: ${error.message}`);
      return false;
    }
  }

  /**
   * Reward loser (consolation gems)
   */
  private async rewardLoser(userId: string, gems: number): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        LOGGER.error(`Loser user not found: ${userId}`);
        return false;
      }

      user.gems += gems;
      // Entry fee already deducted via coinHoldService
      await user.save();

      return true;
    } catch (error: any) {
      LOGGER.error(`Error rewarding loser: ${error.message}`);
      return false;
    }
  }

  /**
   * Refund player (in case of draw or match void)
   */
  private async refundPlayer(userId: string, coins: number): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        LOGGER.error(`User not found for refund: ${userId}`);
        return false;
      }

      user.coins += coins;
      user.heldCoins -= coins; // Release hold
      await user.save();

      return true;
    } catch (error: any) {
      LOGGER.error(`Error refunding player: ${error.message}`);
      return false;
    }
  }

  /**
   * Update match statistics
   */
  private async updateMatchStats(winnerId: string, loserId: string): Promise<void> {
    try {
      // Update winner stats
      await User.findByIdAndUpdate(winnerId, {
        $inc: {
          gamesPlayed: 1,
          gamesWon: 1
        }
      });

      // Update loser stats
      await User.findByIdAndUpdate(loserId, {
        $inc: {
          gamesPlayed: 1
        }
      });

      LOGGER.info(`Updated match stats for winner ${winnerId} and loser ${loserId}`);
    } catch (error: any) {
      LOGGER.error(`Error updating match stats: ${error.message}`);
    }
  }
}

// Export singleton instance
export const rewardService = new RewardService();
