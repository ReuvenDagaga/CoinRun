/**
 * Anti-Cheat Service - Validates game data and detects suspicious activity
 * Prevents cheating through server-side validation
 */
import { PlayerState, PVP_CONSTANTS } from '../../../shared/types/pvp.types.js';
import { LOGGER } from '../log/logger.js';

interface SuspiciousActivity {
  userId: string;
  roomId: string;
  type: 'IMPOSSIBLE_SPEED' | 'TELEPORT' | 'IMPOSSIBLE_TIME' | 'INVALID_SOLDIERS' | 'INPUT_SPAM';
  details: string;
  timestamp: number;
}

export class AntiCheatService {
  private suspiciousActivities: SuspiciousActivity[] = [];
  private inputRateLimits: Map<string, number[]> = new Map(); // userId -> timestamps
  private lastPositions: Map<string, { x: number; y: number; z: number; timestamp: number }> = new Map();

  /**
   * Validate player position (check for impossible movement)
   */
  validatePosition(
    userId: string,
    newPosition: { x: number; y: number; z: number },
    maxSpeed: number = 20 // units per second
  ): boolean {
    const now = Date.now();
    const lastPos = this.lastPositions.get(userId);

    if (lastPos) {
      const deltaTime = (now - lastPos.timestamp) / 1000; // seconds
      const distance = Math.sqrt(
        Math.pow(newPosition.x - lastPos.x, 2) +
        Math.pow(newPosition.y - lastPos.y, 2) +
        Math.pow(newPosition.z - lastPos.z, 2)
      );

      const speed = distance / deltaTime;

      // Check if speed exceeds maximum
      if (speed > maxSpeed * 1.5) { // 1.5x buffer for network variance
        this.flagSuspiciousActivity(userId, '', 'IMPOSSIBLE_SPEED',
          `Speed: ${speed.toFixed(2)} units/sec (max: ${maxSpeed})`);
        LOGGER.warn(`[AntiCheat] Impossible speed detected for ${userId}: ${speed.toFixed(2)} units/sec`);
        return false;
      }

      // Check for teleportation (huge instant jump)
      if (distance > 50 && deltaTime < 0.1) {
        this.flagSuspiciousActivity(userId, '', 'TELEPORT',
          `Moved ${distance.toFixed(2)} units in ${deltaTime.toFixed(3)}s`);
        LOGGER.warn(`[AntiCheat] Teleportation detected for ${userId}`);
        return false;
      }
    }

    // Update last position
    this.lastPositions.set(userId, { ...newPosition, timestamp: now });
    return true;
  }

  /**
   * Validate completion time
   */
  validateCompletionTime(
    completionTime: number,
    trackLength: number,
    maxSpeed: number = 20
  ): boolean {
    // Calculate theoretical minimum time
    const theoreticalMinTime = (trackLength / maxSpeed) * 1000; // milliseconds

    if (completionTime < theoreticalMinTime * 0.8) { // 20% buffer
      LOGGER.warn(`[AntiCheat] Impossible completion time: ${completionTime}ms < min ${theoreticalMinTime}ms`);
      return false;
    }

    return true;
  }

  /**
   * Validate soldier count
   */
  validateSoldierCount(soldiers: number, maxSoldiers: number = 200): boolean {
    if (soldiers < 0 || soldiers > maxSoldiers) {
      LOGGER.warn(`[AntiCheat] Invalid soldier count: ${soldiers}`);
      return false;
    }

    return true;
  }

  /**
   * Rate limit inputs (prevent input spam)
   */
  checkInputRateLimit(userId: string, maxInputsPerSecond: number = 10): boolean {
    const now = Date.now();

    if (!this.inputRateLimits.has(userId)) {
      this.inputRateLimits.set(userId, []);
    }

    const timestamps = this.inputRateLimits.get(userId)!;

    // Remove timestamps older than 1 second
    const recentTimestamps = timestamps.filter(ts => now - ts < 1000);

    // Check if rate limit exceeded
    if (recentTimestamps.length >= maxInputsPerSecond) {
      this.flagSuspiciousActivity(userId, '', 'INPUT_SPAM',
        `${recentTimestamps.length} inputs in 1 second (max: ${maxInputsPerSecond})`);
      LOGGER.warn(`[AntiCheat] Input spam detected for ${userId}: ${recentTimestamps.length} inputs/sec`);
      return false;
    }

    // Add current timestamp
    recentTimestamps.push(now);
    this.inputRateLimits.set(userId, recentTimestamps);

    return true;
  }

  /**
   * Validate entire player state
   */
  validatePlayerState(
    state: PlayerState,
    roomId: string,
    trackLength: number
  ): boolean {
    const { userId, position, soldiers, completionTime } = state;

    // Validate position
    if (!this.validatePosition(userId, position)) {
      return false;
    }

    // Validate soldier count
    if (!this.validateSoldierCount(soldiers)) {
      this.flagSuspiciousActivity(userId, roomId, 'INVALID_SOLDIERS',
        `Invalid soldier count: ${soldiers}`);
      return false;
    }

    // Validate completion time (if finished)
    if (completionTime && !this.validateCompletionTime(completionTime, trackLength)) {
      this.flagSuspiciousActivity(userId, roomId, 'IMPOSSIBLE_TIME',
        `Impossible completion time: ${completionTime}ms for ${trackLength} units`);
      return false;
    }

    return true;
  }

  /**
   * Flag suspicious activity
   */
  private flagSuspiciousActivity(
    userId: string,
    roomId: string,
    type: SuspiciousActivity['type'],
    details: string
  ): void {
    const activity: SuspiciousActivity = {
      userId,
      roomId,
      type,
      details,
      timestamp: Date.now()
    };

    this.suspiciousActivities.push(activity);

    // Keep only last 1000 activities
    if (this.suspiciousActivities.length > 1000) {
      this.suspiciousActivities.shift();
    }

    LOGGER.warn(`[AntiCheat] Flagged: ${type} - ${userId} - ${details}`);
  }

  /**
   * Get suspicious activities for a user
   */
  getSuspiciousActivities(userId?: string): SuspiciousActivity[] {
    if (userId) {
      return this.suspiciousActivities.filter(a => a.userId === userId);
    }
    return this.suspiciousActivities;
  }

  /**
   * Clear tracking data for a user
   */
  clearUserData(userId: string): void {
    this.lastPositions.delete(userId);
    this.inputRateLimits.delete(userId);
  }

  /**
   * Get cheat score for user (higher = more suspicious)
   */
  getCheatScore(userId: string): number {
    const activities = this.getSuspiciousActivities(userId);
    const recentActivities = activities.filter(
      a => Date.now() - a.timestamp < 3600000 // Last hour
    );

    let score = 0;
    for (const activity of recentActivities) {
      switch (activity.type) {
        case 'TELEPORT':
        case 'IMPOSSIBLE_TIME':
          score += 10; // Severe
          break;
        case 'IMPOSSIBLE_SPEED':
          score += 5; // Moderate
          break;
        case 'INVALID_SOLDIERS':
          score += 3; // Minor
          break;
        case 'INPUT_SPAM':
          score += 1; // Very minor
          break;
      }
    }

    return score;
  }

  /**
   * Should ban user? (cheat score > threshold)
   */
  shouldBan(userId: string, threshold: number = 50): boolean {
    return this.getCheatScore(userId) >= threshold;
  }
}

// Export singleton instance
export const antiCheatService = new AntiCheatService();
