import { io, Socket } from 'socket.io-client';
import { CLIENT_CONSTANTS } from '@/utils/constants';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = localStorage.getItem('token');

    socket = io(`${CLIENT_CONSTANTS.SOCKET_URL}/runner`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// Betting events
export function joinBettingQueue(betAmount: number) {
  getSocket().emit('betting:queue', { betAmount });
}

export function leaveBettingQueue() {
  getSocket().emit('betting:leave');
}

// Game events
export function sendReady(matchId: string) {
  getSocket().emit('game:ready', { matchId });
}

export function sendInput(matchId: string, input: { direction: string; timestamp: number }) {
  getSocket().emit('game:input', { matchId, input });
}

export function sendProgress(matchId: string, progress: number, armyCount: number) {
  getSocket().emit('game:progress', { matchId, progress, armyCount });
}

export function sendFinish(matchId: string, result: Record<string, unknown>) {
  getSocket().emit('game:finish', { matchId, result });
}

export function quitGame(matchId: string) {
  getSocket().emit('game:quit', { matchId });
}

// Event listeners
export function onMatchFound(callback: (data: { matchId: string; opponent: unknown; trackSeed: string }) => void) {
  getSocket().on('betting:match_found', callback);
  return () => getSocket().off('betting:match_found', callback);
}

export function onSearching(callback: (data: { queuePosition: number }) => void) {
  getSocket().on('betting:searching', callback);
  return () => getSocket().off('betting:searching', callback);
}

export function onQueueTimeout(callback: () => void) {
  getSocket().on('betting:queue_timeout', callback);
  return () => getSocket().off('betting:queue_timeout', callback);
}

export function onGameCountdown(callback: (data: { seconds: number }) => void) {
  getSocket().on('game:countdown', callback);
  return () => getSocket().off('game:countdown', callback);
}

export function onGameStart(callback: (data: { trackSeed: string; startTime: number }) => void) {
  getSocket().on('game:start', callback);
  return () => getSocket().off('game:start', callback);
}

export function onOpponentProgress(callback: (data: { progress: number; armyCount: number }) => void) {
  getSocket().on('game:opponent_progress', callback);
  return () => getSocket().off('game:opponent_progress', callback);
}

export function onGameFinish(callback: (data: { winnerId: string; results: Record<string, unknown> }) => void) {
  getSocket().on('game:finish', callback);
  return () => getSocket().off('game:finish', callback);
}

export function onOpponentDisconnect(callback: () => void) {
  getSocket().on('game:opponent_disconnect', callback);
  return () => getSocket().off('game:opponent_disconnect', callback);
}

export function onOpponentForfeit(callback: () => void) {
  getSocket().on('game:opponent_forfeit', callback);
  return () => getSocket().off('game:opponent_forfeit', callback);
}

export default {
  getSocket,
  disconnectSocket,
  joinBettingQueue,
  leaveBettingQueue,
  sendReady,
  sendInput,
  sendProgress,
  sendFinish,
  quitGame,
  onMatchFound,
  onSearching,
  onQueueTimeout,
  onGameCountdown,
  onGameStart,
  onOpponentProgress,
  onGameFinish,
  onOpponentDisconnect,
  onOpponentForfeit
};
