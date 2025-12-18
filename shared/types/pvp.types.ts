/**
 * CoinRun PvP Types - Shared between client and server
 * All types used for 1v1 PvP multiplayer
 */

// ============================================================================
// ROOM STATES
// ============================================================================
export enum RoomState {
  WAITING = 'WAITING',       // Waiting for players
  COUNTDOWN = 'COUNTDOWN',   // Pre-game countdown
  PLAYING = 'PLAYING',       // Game in progress
  PAUSED = 'PAUSED',         // Disconnection pause
  FINISHED = 'FINISHED'      // Game ended
}

// ============================================================================
// PLAYER STATE
// ============================================================================
export interface PlayerState {
  userId: string;
  username: string;
  avatar?: string;
  skin: string;
  position: Vector3;
  lane: number;              // -1, 0, 1 (left, center, right)
  soldiers: number;
  isAlive: boolean;
  velocity: Vector3;
  lastInputSequence: number;
  progress: number;          // Track progress (0-1)
  completionTime?: number;   // Time when finished (in ms)
  ready?: boolean;           // Player loaded and ready to start
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

// ============================================================================
// GAME ROOM
// ============================================================================
export interface GameRoom {
  roomId: string;
  player1: PlayerState;
  player2: PlayerState;
  state: RoomState;
  trackSeed: number;
  trackLength: number;
  maxTime: number;           // Calculated: (trackLength / 1000) * 30
  gameStartTime?: number;
  createdAt: number;
  lastActivityAt: number;
}

// ============================================================================
// MATCHMAKING
// ============================================================================
export interface QueueEntry {
  userId: string;
  username: string;
  avatar?: string;
  skin: string;
  powerLevel: number;
  joinedAt: number;
  socketId: string;
  searchRange: number;       // ±20% initially, expands to ±40%
}

export interface MatchFoundPayload {
  roomId: string;
  opponent: {
    userId: string;
    username: string;
    avatar?: string;
    powerLevel: number;
  };
  trackSeed: number;
  trackLength: number;
  yourSkin: string;          // May be changed if conflict
  opponentSkin: string;
}

// ============================================================================
// GAME STATE PACKETS
// ============================================================================
export interface GameStatePacket {
  timestamp: number;
  gameTime: number;          // Time since game start (ms)
  player1: PlayerState;
  player2: PlayerState;
}

export interface InputPacket {
  type: 'LANE_LEFT' | 'LANE_RIGHT' | 'JUMP';
  timestamp: number;
  sequenceNumber: number;
}

// ============================================================================
// SCORING
// ============================================================================
export interface GameResult {
  roomId: string;
  player1: PlayerScore;
  player2: PlayerScore;
  winnerId: string | null;   // null = draw
  winCondition: WinCondition;
}

export interface PlayerScore {
  userId: string;
  soldiers: number;
  completionTime: number;    // ms, or maxTime if died/incomplete
  soldierPoints: number;     // soldiers * 10
  timeBonus: number;         // (maxTime - completionTime) * 5
  totalScore: number;
  isDead: boolean;
}

export enum WinCondition {
  OPPONENT_DIED = 'OPPONENT_DIED',
  HIGHER_SCORE = 'HIGHER_SCORE',
  FASTER_TIME = 'FASTER_TIME',   // Tie-breaker
  FORFEIT = 'FORFEIT',
  DRAW = 'DRAW'
}

// ============================================================================
// REWARDS
// ============================================================================
export interface MatchRewards {
  winner: {
    coins: number;           // 1,950 (1,000 entry × 1.95)
    gems: number;            // 10
  };
  loser: {
    coins: number;           // 0 (lost entry fee)
    gems: number;            // 1 (consolation)
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================
export const PVP_CONSTANTS = {
  ENTRY_FEE: 1000,
  WINNER_MULTIPLIER: 1.95,
  WINNER_GEMS: 10,
  LOSER_GEMS: 1,
  SOLDIER_POINTS: 10,
  TIME_BONUS_POINTS: 5,
  TICK_RATE: 30,             // ticks per second
  TICK_INTERVAL: 33,         // ms (1000/30)
  MATCHMAKING_TIMEOUT: 60000, // 60 seconds
  RECONNECT_TIMEOUT: 30000,   // 30 seconds
  HEARTBEAT_INTERVAL: 5000,   // 5 seconds
  INTERPOLATION_DELAY: 66,    // 66ms (2 ticks)
  OPPONENT_OPACITY: 0.5,
  INITIAL_MATCH_RANGE: 0.2,   // ±20%
  EXPANDED_MATCH_RANGE: 0.4,  // ±40%
  RANGE_EXPANSION_TIME: 30000, // 30 seconds
  ROOM_CLEANUP_TIME: 600000,  // 10 minutes
  DEFAULT_TRACK_LENGTH: 5000,
  MAX_TIME_MULTIPLIER: 30     // (trackLength / 1000) * 30
};
