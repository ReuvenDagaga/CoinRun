import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../../middleware/socketAuthMiddleware.js';

/**
 * Socket.io namespace for CoinRun game
 *
 * ❌ REMOVED: Betting system, 1v1 matchmaking, USDT wagering
 * ✅ KEPT: Basic connection handling for future features
 *
 * Future features this namespace may support:
 * - Real-time leaderboard updates
 * - Live events/tournaments
 * - Social features (spectating, chat)
 * - Push notifications
 *
 * Current game mode: SOLO ONLY (no multiplayer)
 */
export function setupRunnerSocket(io: Server) {
  const runnerNamespace = io.of('/runner');

  runnerNamespace.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`Runner socket connected: ${socket.id}, User: ${socket.userId || 'guest'}`);

    // Future feature: Subscribe to real-time leaderboard updates
    socket.on('leaderboard:subscribe', () => {
      if (socket.userId) {
        socket.join('leaderboard');
        console.log(`User ${socket.userId} subscribed to leaderboard`);
      }
    });

    // Future feature: Unsubscribe from leaderboard
    socket.on('leaderboard:unsubscribe', () => {
      socket.leave('leaderboard');
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      console.log(`Runner socket disconnected: ${socket.id}`);
    });
  });
}

/**
 * Utility function to broadcast leaderboard updates
 * Can be called from game controller after game completion
 */
export function broadcastLeaderboardUpdate(io: Server, leaderboardData: any) {
  const runnerNamespace = io.of('/runner');
  runnerNamespace.to('leaderboard').emit('leaderboard:update', leaderboardData);
}
