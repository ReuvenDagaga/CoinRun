/**
 * Room Manager - Manages active PvP game rooms
 * Singleton class for creating, tracking, and cleaning up game rooms
 */
import { GameRoom, RoomState, PlayerState, PVP_CONSTANTS } from '../../../../shared/types/pvp.types.js';
import { LOGGER } from '../../log/logger.js';
import { v4 as uuidv4 } from 'uuid';

class RoomManager {
  private rooms: Map<string, GameRoom> = new Map();
  private playerRoomMap: Map<string, string> = new Map(); // userId -> roomId
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Auto-cleanup inactive rooms every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveRooms();
    }, 60000);
  }

  /**
   * Create a new game room
   */
  createRoom(
    player1: Omit<PlayerState, 'position' | 'velocity' | 'lastInputSequence' | 'progress'>,
    player2: Omit<PlayerState, 'position' | 'velocity' | 'lastInputSequence' | 'progress'>,
    trackSeed: number,
    trackLength: number
  ): GameRoom {
    const roomId = uuidv4();
    const maxTime = (trackLength / 1000) * PVP_CONSTANTS.MAX_TIME_MULTIPLIER;

    const room: GameRoom = {
      roomId,
      player1: {
        ...player1,
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        lastInputSequence: 0,
        progress: 0,
        ready: false
      },
      player2: {
        ...player2,
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        lastInputSequence: 0,
        progress: 0,
        ready: false
      },
      state: RoomState.WAITING,
      trackSeed,
      trackLength,
      maxTime,
      createdAt: Date.now(),
      lastActivityAt: Date.now()
    };

    this.rooms.set(roomId, room);
    this.playerRoomMap.set(player1.userId, roomId);
    this.playerRoomMap.set(player2.userId, roomId);

    LOGGER.info(`Room created: ${roomId} | P1: ${player1.userId}, P2: ${player2.userId}`);
    return room;
  }

  /**
   * Get room by ID
   */
  getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Get room by player ID
   */
  getRoomByPlayerId(userId: string): GameRoom | undefined {
    const roomId = this.playerRoomMap.get(userId);
    return roomId ? this.rooms.get(roomId) : undefined;
  }

  /**
   * Update room state
   */
  updateRoomState(roomId: string, state: RoomState): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.state = state;
    room.lastActivityAt = Date.now();

    LOGGER.info(`Room ${roomId} state changed to ${state}`);
    return true;
  }

  /**
   * Update player state in room
   */
  updatePlayerState(roomId: string, userId: string, updates: Partial<PlayerState>): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const player = room.player1.userId === userId ? room.player1 : room.player2;
    Object.assign(player, updates);
    room.lastActivityAt = Date.now();

    return true;
  }

  /**
   * Delete room and cleanup
   */
  deleteRoom(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    // Remove player mappings
    this.playerRoomMap.delete(room.player1.userId);
    this.playerRoomMap.delete(room.player2.userId);

    // Remove room
    this.rooms.delete(roomId);

    LOGGER.info(`Room deleted: ${roomId}`);
    return true;
  }

  /**
   * Get all active rooms
   */
  getAllRooms(): GameRoom[] {
    return Array.from(this.rooms.values());
  }

  /**
   * Get room count
   */
  getRoomCount(): number {
    return this.rooms.size;
  }

  /**
   * Cleanup inactive rooms (older than 10 minutes)
   */
  private cleanupInactiveRooms(): void {
    const now = Date.now();
    const roomsToDelete: string[] = [];

    for (const [roomId, room] of this.rooms.entries()) {
      // Cleanup finished rooms after 2 minutes
      if (room.state === RoomState.FINISHED && now - room.lastActivityAt > 120000) {
        roomsToDelete.push(roomId);
      }
      // Cleanup any room inactive for 10 minutes
      else if (now - room.lastActivityAt > PVP_CONSTANTS.ROOM_CLEANUP_TIME) {
        roomsToDelete.push(roomId);
      }
    }

    if (roomsToDelete.length > 0) {
      LOGGER.info(`Cleaning up ${roomsToDelete.length} inactive rooms`);
      roomsToDelete.forEach(roomId => this.deleteRoom(roomId));
    }
  }

  /**
   * Shutdown - clear interval
   */
  shutdown(): void {
    clearInterval(this.cleanupInterval);
    this.rooms.clear();
    this.playerRoomMap.clear();
  }
}

// Export singleton instance
export const roomManager = new RoomManager();
