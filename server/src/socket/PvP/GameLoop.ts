/**
 * Server Game Loop - Authoritative game simulation at 30 ticks/sec
 * Processes inputs, updates positions, detects collisions, broadcasts state
 */
import { GameRoom, RoomState, PlayerState, PVP_CONSTANTS, InputPacket } from '../../../../shared/types/pvp.types.js';
import { LOGGER } from '../../log/logger.js';
import { broadcastGameState } from './socketManager.js';
import { io } from '../../index.js';
import { roomManager } from './RoomManager.js';

interface ActiveGameLoop {
  roomId: string;
  interval: NodeJS.Timeout;
  startTime: number;
  lastTickTime: number;
  tickCount: number;
}

class GameLoopManager {
  private activeLoops: Map<string, ActiveGameLoop> = new Map();
  private pendingInputs: Map<string, InputPacket[]> = new Map(); // roomId -> inputs

  /**
   * Start game loop for a room
   */
  startGameLoop(roomId: string): boolean {
    if (this.activeLoops.has(roomId)) {
      LOGGER.warn(`Game loop already running for room ${roomId}`);
      return false;
    }

    const room = roomManager.getRoom(roomId);
    if (!room) {
      LOGGER.error(`Cannot start game loop: room ${roomId} not found`);
      return false;
    }

    // Update room state
    roomManager.updateRoomState(roomId, RoomState.PLAYING);

    const startTime = Date.now();
    const interval = setInterval(() => {
      this.tick(roomId);
    }, PVP_CONSTANTS.TICK_INTERVAL);

    this.activeLoops.set(roomId, {
      roomId,
      interval,
      startTime,
      lastTickTime: startTime,
      tickCount: 0
    });

    LOGGER.info(`Game loop started for room ${roomId}`);
    return true;
  }

  /**
   * Stop game loop for a room
   */
  stopGameLoop(roomId: string): boolean {
    const loop = this.activeLoops.get(roomId);
    if (!loop) return false;

    clearInterval(loop.interval);
    this.activeLoops.delete(roomId);
    this.pendingInputs.delete(roomId);

    LOGGER.info(`Game loop stopped for room ${roomId}`);
    return true;
  }

  /**
   * Pause game loop (for disconnections)
   */
  pauseGameLoop(roomId: string): boolean {
    const loop = this.activeLoops.get(roomId);
    if (!loop) return false;

    clearInterval(loop.interval);
    roomManager.updateRoomState(roomId, RoomState.PAUSED);

    LOGGER.info(`Game loop paused for room ${roomId}`);
    return true;
  }

  /**
   * Resume game loop
   */
  resumeGameLoop(roomId: string): boolean {
    const loop = this.activeLoops.get(roomId);
    if (!loop) return false;

    // Restart interval
    loop.interval = setInterval(() => {
      this.tick(roomId);
    }, PVP_CONSTANTS.TICK_INTERVAL);

    roomManager.updateRoomState(roomId, RoomState.PLAYING);

    LOGGER.info(`Game loop resumed for room ${roomId}`);
    return true;
  }

  /**
   * Queue input for processing on next tick
   */
  queueInput(roomId: string, userId: string, input: InputPacket): void {
    if (!this.pendingInputs.has(roomId)) {
      this.pendingInputs.set(roomId, []);
    }

    this.pendingInputs.get(roomId)!.push(input);
  }

  /**
   * Main game tick - runs at 30 Hz
   */
  private tick(roomId: string): void {
    const loop = this.activeLoops.get(roomId);
    const room = roomManager.getRoom(roomId);

    if (!loop || !room) {
      this.stopGameLoop(roomId);
      return;
    }

    const now = Date.now();
    const deltaTime = now - loop.lastTickTime;
    const gameTime = now - loop.startTime;

    loop.lastTickTime = now;
    loop.tickCount++;

    // Check if game should end (max time exceeded)
    if (gameTime >= room.maxTime * 1000) {
      this.endGame(roomId, 'timeout');
      return;
    }

    // Process pending inputs
    const inputs = this.pendingInputs.get(roomId) || [];
    this.pendingInputs.set(roomId, []);

    for (const input of inputs) {
      this.processInput(room, input);
    }

    // Update physics/positions (simplified for now)
    this.updatePhysics(room, deltaTime);

    // Check for player inactivity
    this.checkInactivity(room, now);

    // Check win conditions
    this.checkWinConditions(room);

    // Broadcast state to clients (every tick = 30 times/sec)
    broadcastGameState(io, roomId, {
      timestamp: now,
      gameTime,
      player1: room.player1,
      player2: room.player2
    });
  }

  /**
   * Process player input
   */
  private processInput(room: GameRoom, input: InputPacket): void {
    // Inputs are actually processed client-side with server validation
    // Server just validates and broadcasts for opponent
    // This is a simplified implementation
    LOGGER.debug(`Processing input: ${input.type} at ${input.timestamp}`);
  }

  /**
   * Update physics (simplified - actual physics handled client-side with validation)
   */
  private updatePhysics(room: GameRoom, deltaTime: number): void {
    // In a full implementation, server would simulate physics
    // For CoinRun, we trust client physics but validate results
    // This prevents minor network discrepancies while catching major cheats
  }

  /**
   * Check for player inactivity and warn/kick
   */
  private checkInactivity(room: GameRoom, now: number): void {
    const pvpNamespace = io.of('/pvp');

    // Check both players for inactivity
    [room.player1, room.player2].forEach((player, index) => {
      if (!player.isAlive || player.completionTime) return; // Skip dead or finished players

      const timeSinceActivity = now - (player.lastActivityAt || now);

      // Kick after warning time + kick time (40 seconds total)
      if (player.inactivityWarned && timeSinceActivity >= PVP_CONSTANTS.INACTIVITY_WARNING_TIME + PVP_CONSTANTS.INACTIVITY_KICK_TIME) {
        LOGGER.info(`Player ${player.userId} kicked for inactivity (${timeSinceActivity}ms)`);
        // Declare opponent as winner
        this.endGame(room.roomId, `player_${index === 0 ? '1' : '2'}_inactive`);
        return;
      }

      // Warn after 30 seconds of inactivity
      if (!player.inactivityWarned && timeSinceActivity >= PVP_CONSTANTS.INACTIVITY_WARNING_TIME) {
        player.inactivityWarned = true;
        LOGGER.info(`Inactivity warning for player ${player.userId} (${timeSinceActivity}ms)`);
        pvpNamespace.to(room.roomId).emit('player:inactivity_warning', {
          userId: player.userId,
          username: player.username,
          secondsRemaining: Math.floor(PVP_CONSTANTS.INACTIVITY_KICK_TIME / 1000)
        });
      }
    });
  }

  /**
   * Check if game should end
   */
  private checkWinConditions(room: GameRoom): void {
    // Both players finished
    if (room.player1.completionTime && room.player2.completionTime) {
      this.endGame(room.roomId, 'both_finished');
      return;
    }

    // One player finished, other died
    if (room.player1.completionTime && !room.player2.isAlive) {
      this.endGame(room.roomId, 'opponent_died');
      return;
    }

    if (room.player2.completionTime && !room.player1.isAlive) {
      this.endGame(room.roomId, 'opponent_died');
      return;
    }

    // Both players died
    if (!room.player1.isAlive && !room.player2.isAlive) {
      this.endGame(room.roomId, 'both_died');
      return;
    }

    // One player died (wait for other to finish or die)
    // Game continues...
  }

  /**
   * End game and calculate results
   */
  private endGame(roomId: string, reason: string): void {
    LOGGER.info(`Game ending for room ${roomId}: ${reason}`);

    const room = roomManager.getRoom(roomId);
    if (!room) return;

    // Stop game loop
    this.stopGameLoop(roomId);

    // Update room state
    roomManager.updateRoomState(roomId, RoomState.FINISHED);

    // Calculate scores (will be implemented in Phase 4)
    const result = this.calculateResults(room, reason);

    // Emit game finished event
    const pvpNamespace = io.of('/pvp');
    pvpNamespace.to(roomId).emit('game:finished', result);

    // Cleanup room after 2 minutes
    setTimeout(() => {
      roomManager.deleteRoom(roomId);
    }, 120000);
  }

  /**
   * Calculate game results (placeholder - full implementation in Phase 4)
   */
  private calculateResults(room: GameRoom, reason: string): any {
    const { player1, player2 } = room;

    // Simple winner determination
    let winnerId: string | null = null;

    if (reason === 'both_finished') {
      // Compare completion times
      const time1 = player1.completionTime || room.maxTime * 1000;
      const time2 = player2.completionTime || room.maxTime * 1000;

      // Calculate scores: (soldiers × 10) + ((maxTime - completionTime) × 5)
      const score1 = (player1.soldiers * PVP_CONSTANTS.SOLDIER_POINTS) +
                     ((room.maxTime * 1000 - time1) / 1000 * PVP_CONSTANTS.TIME_BONUS_POINTS);
      const score2 = (player2.soldiers * PVP_CONSTANTS.SOLDIER_POINTS) +
                     ((room.maxTime * 1000 - time2) / 1000 * PVP_CONSTANTS.TIME_BONUS_POINTS);

      winnerId = score1 > score2 ? player1.userId : (score2 > score1 ? player2.userId : null);
    } else if (reason === 'opponent_died') {
      winnerId = player1.isAlive ? player1.userId : player2.userId;
    } else if (reason === 'both_died') {
      // Higher soldiers wins
      winnerId = player1.soldiers > player2.soldiers ? player1.userId :
                (player2.soldiers > player1.soldiers ? player2.userId : null);
    }

    return {
      roomId: room.roomId,
      winnerId,
      player1: {
        userId: player1.userId,
        soldiers: player1.soldiers,
        completionTime: player1.completionTime || room.maxTime * 1000,
        isAlive: player1.isAlive
      },
      player2: {
        userId: player2.userId,
        soldiers: player2.soldiers,
        completionTime: player2.completionTime || room.maxTime * 1000,
        isAlive: player2.isAlive
      },
      reason
    };
  }

  /**
   * Get active game count
   */
  getActiveGameCount(): number {
    return this.activeLoops.size;
  }

  /**
   * Shutdown all game loops
   */
  shutdown(): void {
    for (const [roomId] of this.activeLoops) {
      this.stopGameLoop(roomId);
    }
  }
}

// Export singleton instance
export const gameLoopManager = new GameLoopManager();
