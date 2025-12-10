import { Server, Socket } from 'socket.io';
import { AuthenticatedSocket } from '../../middleware/socketAuthMiddleware.js';
import { User } from '../../models/Users.js';
import { RunnerGame } from '../../models/RunnerGame.js';
import { MatchmakingQueue, createMatch, processMatchResult } from './matchmaking.js';

export function setupRunnerSocket(io: Server) {
  const runnerNamespace = io.of('/runner');
  const matchmakingQueue = new MatchmakingQueue();

  // Active games map
  const activeGames = new Map<string, {
    matchId: string;
    players: Map<string, {
      socket: AuthenticatedSocket;
      ready: boolean;
      progress: number;
      armyCount: number;
    }>;
    trackSeed: string;
    betAmount: number;
    startTime?: number;
    status: 'waiting' | 'countdown' | 'playing' | 'finished';
  }>();

  runnerNamespace.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`Runner socket connected: ${socket.id}, User: ${socket.userId || 'guest'}`);

    // Join betting queue
    socket.on('betting:queue', async (data: { betAmount: number }) => {
      if (!socket.userId) {
        socket.emit('error', { message: 'Authentication required for betting' });
        return;
      }

      try {
        const user = await User.findById(socket.userId);
        if (!user) {
          socket.emit('error', { message: 'User not found' });
          return;
        }

        // Validate balance
        if (user.usdtBalance < data.betAmount) {
          socket.emit('error', { message: 'Insufficient balance' });
          return;
        }

        // Calculate power level
        const powerLevel =
          user.upgrades.capacity * 10 +
          user.upgrades.addWarrior * 20 +
          user.upgrades.warriorUpgrade * 10 +
          user.upgrades.income * 5 +
          user.upgrades.speed * 8 +
          user.upgrades.jump * 6 +
          user.upgrades.bulletPower * 12 +
          user.upgrades.magnetRadius * 5;

        // Add to queue
        const queueEntry = {
          odfsId: socket.userId,
          socketId: socket.id,
          betAmount: data.betAmount,
          powerLevel,
          joinedAt: Date.now()
        };

        matchmakingQueue.add(queueEntry);
        socket.emit('betting:searching', { queuePosition: matchmakingQueue.size() });

        // Try to find a match
        const match = matchmakingQueue.findMatch(queueEntry);
        if (match) {
          // Create game
          const trackSeed = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          const matchId = `match-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;

          // Store match
          activeGames.set(matchId, {
            matchId,
            players: new Map(),
            trackSeed,
            betAmount: data.betAmount,
            status: 'waiting'
          });

          // Notify both players
          const matchData = {
            matchId,
            trackSeed,
            betAmount: data.betAmount
          };

          // Get opponent sockets
          const p1Socket = runnerNamespace.sockets.get(match.player1.socketId);
          const p2Socket = runnerNamespace.sockets.get(match.player2.socketId);

          if (p1Socket && p2Socket) {
            const p1User = await User.findById(match.player1.odfsId);
            const p2User = await User.findById(match.player2.odfsId);

            p1Socket.emit('betting:match_found', {
              ...matchData,
              opponent: {
                username: p2User?.username || 'Opponent',
                powerLevel: match.player2.powerLevel,
                skin: p2User?.currentSkin || 'default'
              }
            });

            p2Socket.emit('betting:match_found', {
              ...matchData,
              opponent: {
                username: p1User?.username || 'Opponent',
                powerLevel: match.player1.powerLevel,
                skin: p1User?.currentSkin || 'default'
              }
            });

            // Join both to match room
            p1Socket.join(matchId);
            p2Socket.join(matchId);
          }

          // Remove from queue
          matchmakingQueue.remove(match.player1.odfsId);
          matchmakingQueue.remove(match.player2.odfsId);
        }
      } catch (error) {
        console.error('Queue error:', error);
        socket.emit('error', { message: 'Failed to join queue' });
      }
    });

    // Leave queue
    socket.on('betting:leave', () => {
      if (socket.userId) {
        matchmakingQueue.remove(socket.userId);
        socket.emit('betting:left');
      }
    });

    // Player ready for game
    socket.on('game:ready', (data: { matchId: string }) => {
      const game = activeGames.get(data.matchId);
      if (!game || !socket.userId) return;

      game.players.set(socket.userId, {
        socket,
        ready: true,
        progress: 0,
        armyCount: 0
      });

      // Check if all players ready
      if (game.players.size === 2) {
        const allReady = Array.from(game.players.values()).every(p => p.ready);
        if (allReady) {
          // Start countdown
          game.status = 'countdown';
          runnerNamespace.to(data.matchId).emit('game:countdown', { seconds: 3 });

          setTimeout(() => {
            game.status = 'playing';
            game.startTime = Date.now();
            runnerNamespace.to(data.matchId).emit('game:start', {
              trackSeed: game.trackSeed,
              startTime: game.startTime
            });
          }, 3000);
        }
      }
    });

    // Game input (for server-side validation in production)
    socket.on('game:input', (data: { matchId: string; input: { direction: string; timestamp: number } }) => {
      // In production, server would validate and process inputs
      // For MVP, client handles physics
    });

    // Progress update
    socket.on('game:progress', (data: { matchId: string; progress: number; armyCount: number }) => {
      const game = activeGames.get(data.matchId);
      if (!game || !socket.userId) return;

      const player = game.players.get(socket.userId);
      if (player) {
        player.progress = data.progress;
        player.armyCount = data.armyCount;

        // Broadcast to opponent
        socket.to(data.matchId).emit('game:opponent_progress', {
          progress: data.progress,
          armyCount: data.armyCount
        });
      }
    });

    // Game finished
    socket.on('game:finish', async (data: {
      matchId: string;
      result: {
        finalScore: number;
        coinsCollected: number;
        maxArmy: number;
        distanceTraveled: number;
        timeTaken: number;
        didFinish: boolean;
      }
    }) => {
      const game = activeGames.get(data.matchId);
      if (!game || !socket.userId) return;

      const player = game.players.get(socket.userId);
      if (!player) return;

      // Store result
      (player as any).result = data.result;

      // Check if both players finished
      const allFinished = Array.from(game.players.values()).every(p => (p as any).result);

      if (allFinished) {
        game.status = 'finished';

        // Determine winner
        const results = Array.from(game.players.entries()).map(([odfsId, p]) => ({
          odfsId,
          result: (p as any).result
        }));

        // Winner is who finished first or highest score
        const winner = results.sort((a, b) => {
          if (a.result.didFinish !== b.result.didFinish) {
            return b.result.didFinish ? 1 : -1;
          }
          return b.result.finalScore - a.result.finalScore;
        })[0];

        // Process match result (handle payouts)
        try {
          await processMatchResult(
            data.matchId,
            game.betAmount,
            winner.odfsId,
            results.find(r => r.odfsId !== winner.odfsId)!.odfsId,
            results.map(r => ({
              odfsId: r.odfsId,
              ...r.result
            }))
          );
        } catch (error) {
          console.error('Failed to process match result:', error);
        }

        // Notify players
        runnerNamespace.to(data.matchId).emit('game:finish', {
          winnerId: winner.odfsId,
          results: Object.fromEntries(results.map(r => [r.odfsId, r.result]))
        });

        // Clean up
        activeGames.delete(data.matchId);
      }
    });

    // Player quit
    socket.on('game:quit', async (data: { matchId: string }) => {
      const game = activeGames.get(data.matchId);
      if (!game || !socket.userId) return;

      // In betting mode, quitting = forfeit
      if (game.status === 'playing' && game.betAmount > 0) {
        const opponent = Array.from(game.players.entries())
          .find(([id]) => id !== socket.userId);

        if (opponent) {
          // Opponent wins by forfeit
          await processMatchResult(
            data.matchId,
            game.betAmount,
            opponent[0],
            socket.userId,
            []
          );

          socket.to(data.matchId).emit('game:opponent_forfeit');
        }
      }

      // Clean up
      game.players.delete(socket.userId);
      socket.leave(data.matchId);

      if (game.players.size === 0) {
        activeGames.delete(data.matchId);
      }
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      console.log(`Runner socket disconnected: ${socket.id}`);

      // Remove from queue
      if (socket.userId) {
        matchmakingQueue.remove(socket.userId);
      }

      // Handle active games
      activeGames.forEach((game, matchId) => {
        if (socket.userId && game.players.has(socket.userId)) {
          // Grace period for reconnection
          setTimeout(async () => {
            const currentGame = activeGames.get(matchId);
            if (currentGame && socket.userId && currentGame.players.has(socket.userId)) {
              // Still disconnected, forfeit
              if (currentGame.status === 'playing') {
                const opponent = Array.from(currentGame.players.entries())
                  .find(([id]) => id !== socket.userId);

                if (opponent) {
                  await processMatchResult(
                    matchId,
                    currentGame.betAmount,
                    opponent[0],
                    socket.userId,
                    []
                  );

                  runnerNamespace.to(matchId).emit('game:opponent_disconnect');
                }
              }

              currentGame.players.delete(socket.userId);
              if (currentGame.players.size === 0) {
                activeGames.delete(matchId);
              }
            }
          }, 30000); // 30 second grace period
        }
      });
    });
  });

  // Periodic queue timeout check
  setInterval(() => {
    const timedOut = matchmakingQueue.getTimedOut(30000); // 30 second timeout
    timedOut.forEach(entry => {
      const socket = runnerNamespace.sockets.get(entry.socketId);
      if (socket) {
        socket.emit('betting:queue_timeout');
      }
      matchmakingQueue.remove(entry.odfsId);
    });
  }, 5000);
}
