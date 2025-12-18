/**
 * PvP Socket Client - WebSocket connection for 1v1 PvP
 * Singleton socket instance for real-time multiplayer
 */
import { io, Socket } from 'socket.io-client';
import { MatchFoundPayload, InputPacket, GameStatePacket } from '../../../shared/types/pvp.types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

let pvpSocket: Socket | null = null;

/**
 * Initialize and get PvP socket connection
 */
export function getPvPSocket(): Socket {
  if (!pvpSocket) {
    const token = localStorage.getItem('token');

    pvpSocket = io(`${SOCKET_URL}/pvp`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    // Connection events
    pvpSocket.on('connect', () => {
      console.log('[PvP] Connected:', pvpSocket?.id);
    });

    pvpSocket.on('disconnect', (reason) => {
      console.log('[PvP] Disconnected:', reason);
    });

    pvpSocket.on('connect_error', (error) => {
      console.error('[PvP] Connection error:', error);
    });

    pvpSocket.on('error', (error) => {
      console.error('[PvP] Error:', error);
    });
  }

  return pvpSocket;
}

/**
 * Disconnect PvP socket
 */
export function disconnectPvPSocket() {
  if (pvpSocket) {
    pvpSocket.disconnect();
    pvpSocket = null;
  }
}

// ============================================================================
// MATCHMAKING EVENTS
// ============================================================================

/**
 * Join matchmaking queue
 */
export function joinMatchmaking() {
  getPvPSocket().emit('matchmaking:join');
}

/**
 * Cancel matchmaking
 */
export function cancelMatchmaking() {
  getPvPSocket().emit('matchmaking:cancel');
}

/**
 * Listen for matchmaking search status
 */
export function onMatchmakingSearching(callback: (data: { powerLevel: number }) => void) {
  const socket = getPvPSocket();
  socket.on('matchmaking:searching', callback);
  return () => socket.off('matchmaking:searching', callback);
}

/**
 * Listen for match found
 */
export function onMatchFound(callback: (data: { player1: MatchFoundPayload; player2: MatchFoundPayload }) => void) {
  const socket = getPvPSocket();
  socket.on('matchmaking:found', callback);
  return () => socket.off('matchmaking:found', callback);
}

/**
 * Listen for matchmaking timeout
 */
export function onMatchmakingTimeout(callback: () => void) {
  const socket = getPvPSocket();
  socket.on('matchmaking:timeout', callback);
  return () => socket.off('matchmaking:timeout', callback);
}

/**
 * Listen for matchmaking canceled
 */
export function onMatchmakingCanceled(callback: () => void) {
  const socket = getPvPSocket();
  socket.on('matchmaking:canceled', callback);
  return () => socket.off('matchmaking:canceled', callback);
}

// ============================================================================
// GAME EVENTS
// ============================================================================

/**
 * Send ready signal (player loaded into game)
 */
export function sendReady(roomId: string) {
  getPvPSocket().emit('game:ready', { roomId });
}

/**
 * Send player input
 */
export function sendInput(roomId: string, input: InputPacket) {
  getPvPSocket().emit('game:input', { roomId, input });
}

/**
 * Send player finished
 */
export function sendFinished(roomId: string, completionTime: number, soldiers: number) {
  getPvPSocket().emit('game:finished', { roomId, completionTime, soldiers });
}

/**
 * Send player died
 */
export function sendPlayerDied(roomId: string) {
  getPvPSocket().emit('game:player_died', { roomId });
}

/**
 * Listen for ready acknowledgment
 */
export function onReadyAck(callback: (data: { roomId: string }) => void) {
  const socket = getPvPSocket();
  socket.on('game:ready_ack', callback);
  return () => socket.off('game:ready_ack', callback);
}

/**
 * Listen for countdown
 */
export function onGameCountdown(callback: (data: { seconds: number }) => void) {
  const socket = getPvPSocket();
  socket.on('game:countdown', callback);
  return () => socket.off('game:countdown', callback);
}

/**
 * Listen for game start
 */
export function onGameStart(callback: (data: { roomId: string; timestamp: number }) => void) {
  const socket = getPvPSocket();
  socket.on('game:start', callback);
  return () => socket.off('game:start', callback);
}

/**
 * Listen for game state updates (30 times/sec)
 */
export function onGameState(callback: (state: GameStatePacket) => void) {
  const socket = getPvPSocket();
  socket.on('game:state', callback);
  return () => socket.off('game:state', callback);
}

/**
 * Listen for player input (for interpolation)
 */
export function onPlayerInput(callback: (data: { userId: string; input: InputPacket }) => void) {
  const socket = getPvPSocket();
  socket.on('game:player_input', callback);
  return () => socket.off('game:player_input', callback);
}

/**
 * Listen for player finished
 */
export function onPlayerFinished(callback: (data: { userId: string; completionTime: number; soldiers: number }) => void) {
  const socket = getPvPSocket();
  socket.on('game:player_finished', callback);
  return () => socket.off('game:player_finished', callback);
}

/**
 * Listen for player died
 */
export function onPlayerDied(callback: (data: { userId: string }) => void) {
  const socket = getPvPSocket();
  socket.on('game:player_died', callback);
  return () => socket.off('game:player_died', callback);
}

/**
 * Listen for game paused (disconnection)
 */
export function onGamePaused(callback: (data: { userId: string; reason: string }) => void) {
  const socket = getPvPSocket();
  socket.on('game:paused', callback);
  return () => socket.off('game:paused', callback);
}

/**
 * Listen for game resumed
 */
export function onGameResumed(callback: (data: { seconds: number }) => void) {
  const socket = getPvPSocket();
  socket.on('game:resumed', callback);
  return () => socket.off('game:resumed', callback);
}

/**
 * Listen for game finished
 */
export function onGameFinished(callback: (data: any) => void) {
  const socket = getPvPSocket();
  socket.on('game:finished', callback);
  return () => socket.off('game:finished', callback);
}

// ============================================================================
// ROOM MANAGEMENT
// ============================================================================

/**
 * Join a room (for socket.io rooms)
 */
export function joinRoom(roomId: string) {
  getPvPSocket().emit('room:join', { roomId });
}

/**
 * Leave a room
 */
export function leaveRoom(roomId: string) {
  getPvPSocket().emit('room:leave', { roomId });
}

// Export default object with all functions
export default {
  getPvPSocket,
  disconnectPvPSocket,
  joinMatchmaking,
  cancelMatchmaking,
  onMatchmakingSearching,
  onMatchFound,
  onMatchmakingTimeout,
  onMatchmakingCanceled,
  sendReady,
  sendInput,
  sendFinished,
  sendPlayerDied,
  onReadyAck,
  onGameCountdown,
  onGameStart,
  onGameState,
  onPlayerInput,
  onPlayerFinished,
  onPlayerDied,
  onGamePaused,
  onGameResumed,
  onGameFinished,
  joinRoom,
  leaveRoom
};
