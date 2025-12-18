/**
 * Scoring Service - Calculates winner and scores for PvP matches
 * Formula: score = (soldiers × 10) + ((maxTime - completionTime) × 5)
 */
import { GameRoom, GameResult, PlayerScore, WinCondition, PVP_CONSTANTS } from '../../../shared/types/pvp.types.js';
import { LOGGER } from '../log/logger.js';

export class ScoringService {
  /**
   * Calculate match results and determine winner
   */
  calculateMatchResult(room: GameRoom): GameResult {
    const { player1, player2, maxTime } = room;

    // Calculate individual scores
    const player1Score = this.calculatePlayerScore(
      player1.soldiers,
      player1.completionTime,
      maxTime,
      player1.isAlive
    );

    const player2Score = this.calculatePlayerScore(
      player2.soldiers,
      player2.completionTime,
      maxTime,
      player2.isAlive
    );

    // Determine winner
    const { winnerId, winCondition } = this.determineWinner(
      player1.userId,
      player2.userId,
      player1Score,
      player2Score
    );

    const result: GameResult = {
      roomId: room.roomId,
      player1: player1Score,
      player2: player2Score,
      winnerId,
      winCondition
    };

    LOGGER.info(`Match result: Winner=${winnerId}, Condition=${winCondition}, P1=${player1Score.totalScore}, P2=${player2Score.totalScore}`);
    return result;
  }

  /**
   * Calculate individual player score
   */
  private calculatePlayerScore(
    soldiers: number,
    completionTime: number | undefined,
    maxTime: number,
    isAlive: boolean
  ): PlayerScore {
    // If player didn't complete or died, use maxTime
    const finalTime = completionTime || (maxTime * 1000);
    const isDead = !isAlive;

    // Soldier points
    const soldierPoints = soldiers * PVP_CONSTANTS.SOLDIER_POINTS;

    // Time bonus (only if alive and completed)
    let timeBonus = 0;
    if (isAlive && completionTime) {
      const timeSaved = (maxTime * 1000) - completionTime;
      timeBonus = Math.max(0, (timeSaved / 1000) * PVP_CONSTANTS.TIME_BONUS_POINTS);
    }

    const totalScore = soldierPoints + timeBonus;

    return {
      userId: '', // Set by caller
      soldiers,
      completionTime: finalTime,
      soldierPoints,
      timeBonus: Math.floor(timeBonus),
      totalScore: Math.floor(totalScore),
      isDead
    };
  }

  /**
   * Determine winner based on scores and conditions
   */
  private determineWinner(
    player1Id: string,
    player2Id: string,
    player1Score: PlayerScore,
    player2Score: PlayerScore
  ): { winnerId: string | null; winCondition: WinCondition } {
    // Both died
    if (player1Score.isDead && player2Score.isDead) {
      if (player1Score.soldiers > player2Score.soldiers) {
        return { winnerId: player1Id, winCondition: WinCondition.HIGHER_SCORE };
      } else if (player2Score.soldiers > player1Score.soldiers) {
        return { winnerId: player2Id, winCondition: WinCondition.HIGHER_SCORE };
      } else {
        return { winnerId: null, winCondition: WinCondition.DRAW };
      }
    }

    // One died
    if (player1Score.isDead) {
      return { winnerId: player2Id, winCondition: WinCondition.OPPONENT_DIED };
    }
    if (player2Score.isDead) {
      return { winnerId: player1Id, winCondition: WinCondition.OPPONENT_DIED };
    }

    // Both alive - compare scores
    if (player1Score.totalScore > player2Score.totalScore) {
      return { winnerId: player1Id, winCondition: WinCondition.HIGHER_SCORE };
    } else if (player2Score.totalScore > player1Score.totalScore) {
      return { winnerId: player2Id, winCondition: WinCondition.HIGHER_SCORE };
    }

    // Exact same score - use completion time as tiebreaker
    if (player1Score.completionTime < player2Score.completionTime) {
      return { winnerId: player1Id, winCondition: WinCondition.FASTER_TIME };
    } else if (player2Score.completionTime < player1Score.completionTime) {
      return { winnerId: player2Id, winCondition: WinCondition.FASTER_TIME };
    }

    // Perfect tie (extremely rare)
    return { winnerId: null, winCondition: WinCondition.DRAW };
  }

  /**
   * Validate score legitimacy (anti-cheat)
   * Returns true if score is valid, false if suspicious
   */
  validateScore(score: PlayerScore, trackLength: number, maxTime: number): boolean {
    // Check completion time is >= theoretical minimum
    const theoreticalMinTime = (trackLength / 20) * 1000; // Assuming max speed of 20 units/sec
    if (score.completionTime < theoreticalMinTime) {
      LOGGER.warn(`Suspicious completion time: ${score.completionTime}ms < min ${theoreticalMinTime}ms`);
      return false;
    }

    // Check soldier count is reasonable
    if (score.soldiers > 200) { // Arbitrary max
      LOGGER.warn(`Suspicious soldier count: ${score.soldiers}`);
      return false;
    }

    // Check score calculation is correct
    const expectedScore = (score.soldiers * PVP_CONSTANTS.SOLDIER_POINTS) +
                         Math.floor(((maxTime * 1000 - score.completionTime) / 1000) * PVP_CONSTANTS.TIME_BONUS_POINTS);

    if (Math.abs(score.totalScore - expectedScore) > 10) { // Allow small rounding errors
      LOGGER.warn(`Score calculation mismatch: ${score.totalScore} vs expected ${expectedScore}`);
      return false;
    }

    return true;
  }
}

// Export singleton instance
export const scoringService = new ScoringService();
