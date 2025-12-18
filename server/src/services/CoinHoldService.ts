/**
 * Coin Hold Service - Manages entry fee holds during matchmaking
 * Prevents double-spending and ensures fair coin handling
 */
import { User } from '../models/Users.js';
import { IUser } from '../../../shared/interface/IUser.js';
import { LOGGER } from '../log/logger.js';
import { PVP_CONSTANTS } from '../../../shared/types/pvp.types.js';

export class CoinHoldService {
  /**
   * Place hold on coins (when entering matchmaking queue)
   * Deducts from available balance, adds to held balance
   */
  async placeHold(userId: string, amount: number = PVP_CONSTANTS.ENTRY_FEE): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        LOGGER.error(`User not found: ${userId}`);
        return false;
      }

      // Check if user has enough coins
      if (user.coins < amount) {
        LOGGER.warn(`Insufficient coins for ${userId}: has ${user.coins}, needs ${amount}`);
        return false;
      }

      // Place hold
      user.coins -= amount;
      user.heldCoins += amount;
      await user.save();

      LOGGER.info(`Placed hold of ${amount} coins for user ${userId}`);
      return true;
    } catch (error: any) {
      LOGGER.error(`Error placing hold: ${error.message}`);
      return false;
    }
  }

  /**
   * Convert hold to deduction (when match starts)
   * Moves coins from held to actually spent (removed entirely)
   */
  async convertHoldToDeduction(userId: string, amount: number = PVP_CONSTANTS.ENTRY_FEE): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        LOGGER.error(`User not found: ${userId}`);
        return false;
      }

      // Check if user has held coins
      if (user.heldCoins < amount) {
        LOGGER.error(`Insufficient held coins for ${userId}: has ${user.heldCoins}, needs ${amount}`);
        return false;
      }

      // Convert hold to deduction
      user.heldCoins -= amount;
      // Coins already deducted from available balance in placeHold
      await user.save();

      LOGGER.info(`Converted hold to deduction for user ${userId}: ${amount} coins`);
      return true;
    } catch (error: any) {
      LOGGER.error(`Error converting hold: ${error.message}`);
      return false;
    }
  }

  /**
   * Release hold (when matchmaking cancelled or timeout)
   * Returns coins from held back to available balance
   */
  async releaseHold(userId: string, amount: number = PVP_CONSTANTS.ENTRY_FEE): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        LOGGER.error(`User not found: ${userId}`);
        return false;
      }

      // Check if user has held coins
      if (user.heldCoins < amount) {
        LOGGER.warn(`Cannot release hold: user ${userId} has ${user.heldCoins}, releasing ${amount}`);
        // Release what's available
        const releaseAmount = Math.min(user.heldCoins, amount);
        user.coins += releaseAmount;
        user.heldCoins -= releaseAmount;
      } else {
        // Release full amount
        user.coins += amount;
        user.heldCoins -= amount;
      }

      await user.save();

      LOGGER.info(`Released hold for user ${userId}: ${amount} coins`);
      return true;
    } catch (error: any) {
      LOGGER.error(`Error releasing hold: ${error.message}`);
      return false;
    }
  }

  /**
   * Refund both players (when match is voided)
   */
  async refundBothPlayers(player1Id: string, player2Id: string): Promise<boolean> {
    try {
      const result1 = await this.releaseHold(player1Id);
      const result2 = await this.releaseHold(player2Id);

      if (!result1 || !result2) {
        LOGGER.error(`Failed to refund both players: ${player1Id}, ${player2Id}`);
        return false;
      }

      LOGGER.info(`Refunded both players: ${player1Id}, ${player2Id}`);
      return true;
    } catch (error: any) {
      LOGGER.error(`Error refunding players: ${error.message}`);
      return false;
    }
  }

  /**
   * Check if user can afford entry fee
   */
  async canAffordEntry(userId: string): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user) return false;

      return user.coins >= PVP_CONSTANTS.ENTRY_FEE;
    } catch (error: any) {
      LOGGER.error(`Error checking affordability: ${error.message}`);
      return false;
    }
  }

  /**
   * Get user's available coins (excluding held)
   */
  async getAvailableCoins(userId: string): Promise<number> {
    try {
      const user = await User.findById(userId);
      if (!user) return 0;

      return user.coins;
    } catch (error: any) {
      LOGGER.error(`Error getting available coins: ${error.message}`);
      return 0;
    }
  }
}

// Export singleton instance
export const coinHoldService = new CoinHoldService();
