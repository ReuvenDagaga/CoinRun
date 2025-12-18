/**
 * Matchmaking Service - Queue and match players by power level
 * Matches players within ±20% power level, expanding to ±40% after 30 seconds
 */
import { QueueEntry, MatchFoundPayload, PVP_CONSTANTS } from '../../../../shared/types/pvp.types.js';
import { LOGGER } from '../../log/logger.js';
import { roomManager } from './RoomManager.js';
import { emitMatchFound } from './socketManager.js';
import { io } from '../../index.js';
import { coinHoldService } from '../../services/CoinHoldService.js';

class MatchmakingService {
  private queue: Map<string, QueueEntry> = new Map();
  private timeoutTimers: Map<string, NodeJS.Timeout> = new Map();
  private rangeExpansionTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Add player to matchmaking queue
   */
  async joinQueue(entry: Omit<QueueEntry, 'joinedAt' | 'searchRange'>): Promise<void> {
    const { userId } = entry;

    // Check if already in queue
    if (this.queue.has(userId)) {
      throw new Error('Already in matchmaking queue');
    }

    // Check if already in active game
    const activeRoom = roomManager.getRoomByPlayerId(userId);
    if (activeRoom) {
      throw new Error('Already in an active game');
    }

    // Add to queue
    const queueEntry: QueueEntry = {
      ...entry,
      joinedAt: Date.now(),
      searchRange: PVP_CONSTANTS.INITIAL_MATCH_RANGE
    };

    this.queue.set(userId, queueEntry);
    LOGGER.info(`Player ${userId} joined queue (power: ${entry.powerLevel}, queue size: ${this.queue.size})`);

    // Set timeout (60 seconds)
    const timeoutTimer = setTimeout(() => {
      this.handleTimeout(userId);
    }, PVP_CONSTANTS.MATCHMAKING_TIMEOUT);
    this.timeoutTimers.set(userId, timeoutTimer);

    // Set range expansion timer (30 seconds)
    const rangeTimer = setTimeout(() => {
      this.expandSearchRange(userId);
    }, PVP_CONSTANTS.RANGE_EXPANSION_TIME);
    this.rangeExpansionTimers.set(userId, rangeTimer);

    // Try to find a match immediately
    this.tryMatchmaking(userId);
  }

  /**
   * Remove player from queue
   */
  removeFromQueue(userId: string): void {
    if (!this.queue.has(userId)) return;

    // Clear timers
    const timeoutTimer = this.timeoutTimers.get(userId);
    const rangeTimer = this.rangeExpansionTimers.get(userId);
    if (timeoutTimer) clearTimeout(timeoutTimer);
    if (rangeTimer) clearTimeout(rangeTimer);

    this.timeoutTimers.delete(userId);
    this.rangeExpansionTimers.delete(userId);
    this.queue.delete(userId);

    LOGGER.info(`Player ${userId} removed from queue (queue size: ${this.queue.size})`);
  }

  /**
   * Try to find a match for a player
   */
  private tryMatchmaking(userId: string): void {
    const player = this.queue.get(userId);
    if (!player) return;

    const { powerLevel, searchRange } = player;
    const minPower = powerLevel * (1 - searchRange);
    const maxPower = powerLevel * (1 + searchRange);

    LOGGER.debug(`Searching for match: userId=${userId}, power=${powerLevel}, range=[${minPower}, ${maxPower}]`);

    // Find potential matches
    for (const [opponentId, opponent] of this.queue.entries()) {
      // Skip self
      if (opponentId === userId) continue;

      // Check if opponent is within power range
      if (opponent.powerLevel >= minPower && opponent.powerLevel <= maxPower) {
        // Check if opponent's range also includes this player
        const oppMinPower = opponent.powerLevel * (1 - opponent.searchRange);
        const oppMaxPower = opponent.powerLevel * (1 + opponent.searchRange);

        if (powerLevel >= oppMinPower && powerLevel <= oppMaxPower) {
          // Match found!
          this.createMatch(player, opponent);
          return;
        }
      }
    }

    LOGGER.debug(`No match found for ${userId} yet`);
  }

  /**
   * Create a match between two players
   */
  private async createMatch(player1: QueueEntry, player2: QueueEntry): Promise<void> {
    LOGGER.info(`Match found! P1: ${player1.userId} (${player1.powerLevel}) vs P2: ${player2.userId} (${player2.powerLevel})`);

    // Remove both from queue
    this.removeFromQueue(player1.userId);
    this.removeFromQueue(player2.userId);

    // Convert coin holds to deductions
    await coinHoldService.convertHoldToDeduction(player1.userId);
    await coinHoldService.convertHoldToDeduction(player2.userId);

    // Generate track seed and length
    const trackSeed = Date.now() + Math.floor(Math.random() * 1000000);
    const trackLength = PVP_CONSTANTS.DEFAULT_TRACK_LENGTH;

    // Handle skin conflicts
    let player1Skin = player1.skin;
    let player2Skin = player2.skin;

    if (player1Skin === player2Skin) {
      // Give player2 a different skin (simplified - just use 'default' or 'blue')
      player2Skin = player1Skin === 'default' ? 'blue' : 'default';
      LOGGER.info(`Skin conflict resolved: P2 changed from ${player1Skin} to ${player2Skin}`);
    }

    // Create game room
    const room = roomManager.createRoom(
      {
        userId: player1.userId,
        username: player1.username,
        avatar: player1.avatar,
        skin: player1Skin,
        lane: 0,
        soldiers: 0,
        isAlive: true
      },
      {
        userId: player2.userId,
        username: player2.username,
        avatar: player2.avatar,
        skin: player2Skin,
        lane: 0,
        soldiers: 0,
        isAlive: true
      },
      trackSeed,
      trackLength
    );

    // Emit match found to both players
    const player1Payload: MatchFoundPayload = {
      roomId: room.roomId,
      opponent: {
        userId: player2.userId,
        username: player2.username,
        avatar: player2.avatar,
        powerLevel: player2.powerLevel
      },
      trackSeed,
      trackLength,
      yourSkin: player1Skin,
      opponentSkin: player2Skin
    };

    const player2Payload: MatchFoundPayload = {
      roomId: room.roomId,
      opponent: {
        userId: player1.userId,
        username: player1.username,
        avatar: player1.avatar,
        powerLevel: player1.powerLevel
      },
      trackSeed,
      trackLength,
      yourSkin: player2Skin,
      opponentSkin: player1Skin
    };

    emitMatchFound(io, player1.socketId, player2.socketId, {
      player1: player1Payload,
      player2: player2Payload
    });
  }

  /**
   * Expand search range after 30 seconds
   */
  private expandSearchRange(userId: string): void {
    const player = this.queue.get(userId);
    if (!player) return;

    player.searchRange = PVP_CONSTANTS.EXPANDED_MATCH_RANGE;
    LOGGER.info(`Search range expanded for ${userId}: ±${PVP_CONSTANTS.EXPANDED_MATCH_RANGE * 100}%`);

    // Try matching again with expanded range
    this.tryMatchmaking(userId);

    // Also trigger matchmaking for other players (they might now match)
    for (const [otherUserId] of this.queue.entries()) {
      if (otherUserId !== userId) {
        this.tryMatchmaking(otherUserId);
      }
    }
  }

  /**
   * Handle matchmaking timeout (60 seconds)
   */
  private async handleTimeout(userId: string): Promise<void> {
    const player = this.queue.get(userId);
    if (!player) return;

    LOGGER.info(`Matchmaking timeout for ${userId}`);

    // Release coin hold
    await coinHoldService.releaseHold(userId);

    // Emit timeout event
    const pvpNamespace = io.of('/pvp');
    pvpNamespace.to(player.socketId).emit('matchmaking:timeout');

    // Remove from queue
    this.removeFromQueue(userId);
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.queue.size;
  }

  /**
   * Get queue entries (for debugging)
   */
  getQueue(): QueueEntry[] {
    return Array.from(this.queue.values());
  }
}

// Export singleton instance
export const matchmakingService = new MatchmakingService();
