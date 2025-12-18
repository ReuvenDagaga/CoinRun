/**
 * PvP Socket Manager - Main socket.io handler for 1v1 PvP
 */
import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../../middleware/socketAuthMiddleware.js';
import { LOGGER } from '../../log/logger.js';
import { matchmakingService } from './matchmakingService.js';
import { roomManager } from './RoomManager.js';
import { InputPacket } from '../../../../shared/types/pvp.types.js';

export function setupPvPSocket(io: Server) {
  const pvpNamespace = io.of('/pvp');

  pvpNamespace.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId;
    const username = socket.user?.username || 'Guest';

    LOGGER.info(`PvP socket connected: ${socket.id}, User: ${userId || 'guest'}`);

    // ========================================================================
    // MATCHMAKING EVENTS
    // ========================================================================

    /**
     * Join matchmaking queue
     * Client sends: { }
     */
    socket.on('matchmaking:join', async () => {
      if (!userId || !socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      try {
        const powerLevel = socket.user.getPowerLevel();
        const skin = socket.user.currentSkin || 'default';
        const avatar = socket.user.avatar;

        LOGGER.info(`User ${userId} joining matchmaking queue (power: ${powerLevel})`);

        await matchmakingService.joinQueue({
          userId,
          username,
          avatar,
          skin,
          powerLevel,
          socketId: socket.id
        });

        socket.emit('matchmaking:searching', { powerLevel });
      } catch (error: any) {
        LOGGER.error(`Matchmaking join error: ${error.message}`);
        socket.emit('error', { message: error.message });
      }
    });

    /**
     * Cancel matchmaking
     */
    socket.on('matchmaking:cancel', () => {
      if (!userId) return;

      LOGGER.info(`User ${userId} canceling matchmaking`);
      matchmakingService.removeFromQueue(userId);
      socket.emit('matchmaking:canceled');
    });

    // ========================================================================
    // GAME EVENTS
    // ========================================================================

    /**
     * Player ready (loaded into game)
     * Client sends: { roomId: string }
     */
    socket.on('game:ready', ({ roomId }: { roomId: string }) => {
      if (!userId) return;

      LOGGER.info(`Player ${userId} ready in room ${roomId}`);
      const room = roomManager.getRoom(roomId);

      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      // Mark player as ready (handled by game loop)
      socket.emit('game:ready_ack', { roomId });
    });

    /**
     * Player input
     * Client sends: { roomId: string, input: InputPacket }
     */
    socket.on('game:input', ({ roomId, input }: { roomId: string; input: InputPacket }) => {
      if (!userId) return;

      const room = roomManager.getRoom(roomId);
      if (!room) return;

      // Forward input to game loop for processing
      // Game loop will validate and apply input
      pvpNamespace.to(roomId).emit('game:player_input', {
        userId,
        input
      });
    });

    /**
     * Player finished track
     * Client sends: { roomId: string, completionTime: number, soldiers: number }
     */
    socket.on('game:finished', ({ roomId, completionTime, soldiers }: {
      roomId: string;
      completionTime: number;
      soldiers: number;
    }) => {
      if (!userId) return;

      LOGGER.info(`Player ${userId} finished in room ${roomId}: ${completionTime}ms, ${soldiers} soldiers`);

      const room = roomManager.getRoom(roomId);
      if (!room) return;

      // Update player state
      const playerState = room.player1.userId === userId ? room.player1 : room.player2;
      playerState.completionTime = completionTime;
      playerState.soldiers = soldiers;

      // Notify room
      pvpNamespace.to(roomId).emit('game:player_finished', {
        userId,
        completionTime,
        soldiers
      });
    });

    /**
     * Player died
     * Client sends: { roomId: string }
     */
    socket.on('game:player_died', ({ roomId }: { roomId: string }) => {
      if (!userId) return;

      LOGGER.info(`Player ${userId} died in room ${roomId}`);

      const room = roomManager.getRoom(roomId);
      if (!room) return;

      // Update player state
      const playerState = room.player1.userId === userId ? room.player1 : room.player2;
      playerState.isAlive = false;

      // Notify room
      pvpNamespace.to(roomId).emit('game:player_died', { userId });
    });

    // ========================================================================
    // DISCONNECTION HANDLING
    // ========================================================================

    socket.on('disconnect', () => {
      LOGGER.info(`PvP socket disconnected: ${socket.id}`);

      if (userId) {
        // Remove from matchmaking queue
        matchmakingService.removeFromQueue(userId);

        // Handle active game disconnection
        const activeRoom = roomManager.getRoomByPlayerId(userId);
        if (activeRoom) {
          LOGGER.info(`Player ${userId} disconnected from active game ${activeRoom.roomId}`);
          // Pause game and start reconnection timer
          pvpNamespace.to(activeRoom.roomId).emit('game:paused', {
            userId,
            reason: 'disconnect'
          });
        }
      }
    });
  });

  return pvpNamespace;
}

/**
 * Utility: Broadcast game state to room
 */
export function broadcastGameState(io: Server, roomId: string, gameState: any) {
  const pvpNamespace = io.of('/pvp');
  pvpNamespace.to(roomId).emit('game:state', gameState);
}

/**
 * Utility: Emit match found to both players
 */
export function emitMatchFound(io: Server, player1SocketId: string, player2SocketId: string, payload: any) {
  const pvpNamespace = io.of('/pvp');
  pvpNamespace.to(player1SocketId).emit('matchmaking:found', payload);
  pvpNamespace.to(player2SocketId).emit('matchmaking:found', payload);
}
