import { create } from 'zustand';
import type {
  PlayerState,
  TrackData,
  GameResult,
  SwipeDirection,
} from '@shared/types/game.types';

// Speed effect type for active effects display
export interface SpeedEffect {
  type: 'boost' | 'slow';
  remainingTime: number;
  startTime: number;
}

// Simplified game state - core mechanics only
interface GameState {
  // Game status
  status: 'idle' | 'loading' | 'countdown' | 'playing' | 'paused' | 'finished' | 'gameover';
  gameMode: 'solo' | '1v1';

  // Player state (simplified)
  player: PlayerState;

  // Track
  track: TrackData | null;

  // Game progress
  elapsedTime: number;
  countdown: number;

  // Results
  result: GameResult | null;

  // Speed multiplier from gates
  speedMultiplier: number;
  activeSpeedEffect: SpeedEffect | null;

  // For backward compatibility (not used in simplified version)
  activePowerUps: Array<{ type: string; remainingTime: number }>;
  opponent: null;
  opponentProgress: number;

  // Actions
  initGame: (mode: 'solo' | '1v1', track: TrackData, upgrades: { capacity: number; addWarrior: number; speed: number }) => void;
  handleSwipe: (direction: SwipeDirection) => void;
  stopHorizontalMovement: () => void;
  updatePlayerPosition: (z: number, x?: number) => void;
  startCountdown: () => void;
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  finishGame: () => void;
  gameOver: () => void;
  updateTime: (delta: number) => void;
  reset: () => void;

  // Gate effect actions
  setSpeedMultiplier: (multiplier: number, effectType: 'boost' | 'slow', duration: number) => void;
  clearSpeedEffect: () => void;
  multiplyArmy: (multiplier: number) => void;
  divideArmy: (divisor: number) => void;

  // Legacy actions (kept for compatibility)
  collectCoin: (value: number) => void;
  collectGate: (type: string, value: number) => void;
  damageArmy: (damage: number) => void;
  addSoldiers: (count: number) => void;
  multiplySoldiers: (multiplier: number) => void;
  activatePowerUp: (type: string, duration: number) => void;
  updatePowerUps: (delta: number) => void;
  killEnemy: (reward: number) => void;
  perfectGate: () => void;
  updateOpponent: (progress: number, armyCount: number) => void;
}

const initialPlayerState: PlayerState = {
  id: '',
  position: { x: 0, y: 0, z: 0 },
  lane: 1,
  horizontalVelocity: 0,
  isJumping: false,
  armyCount: 1,
  score: 0,
  coinsCollected: 0,
  distanceTraveled: 0,
  activePowerUps: []
};

export const useGameStore = create<GameState>((set, get) => ({
  status: 'idle',
  gameMode: 'solo',
  player: { ...initialPlayerState },
  track: null,
  elapsedTime: 0,
  countdown: 3,
  result: null,
  speedMultiplier: 1.0,
  activeSpeedEffect: null,
  opponent: null,
  opponentProgress: 0,
  activePowerUps: [],

  initGame: (mode, track, _upgrades) => {
    set({
      status: 'loading',
      gameMode: mode,
      track,
      player: {
        ...initialPlayerState,
        id: 'player-' + Date.now(),
        armyCount: 1,
        horizontalVelocity: 0,
      },
      elapsedTime: 0,
      countdown: 3,
      result: null,
      speedMultiplier: 1.0,
      activeSpeedEffect: null,
    });
  },

  handleSwipe: (direction) => {
    const { status, player } = get();
    if (status !== 'playing') return;

    if (direction === 'left') {
      set({
        player: {
          ...player,
          horizontalVelocity: -1
        }
      });
    } else if (direction === 'right') {
      set({
        player: {
          ...player,
          horizontalVelocity: 1
        }
      });
    }
    // Note: 'up' (jump) is disabled in simplified version
  },

  stopHorizontalMovement: () => {
    const { player } = get();
    set({
      player: {
        ...player,
        horizontalVelocity: 0
      }
    });
  },

  updatePlayerPosition: (z, x) => {
    const { player } = get();
    set({
      player: {
        ...player,
        position: {
          ...player.position,
          z,
          ...(x !== undefined && { x })
        },
        distanceTraveled: z
      }
    });
  },

  startCountdown: () => {
    set({ status: 'countdown', countdown: 3 });
  },

  startGame: () => {
    set({ status: 'playing' });
  },

  pauseGame: () => {
    const { status } = get();
    if (status === 'playing') {
      set({ status: 'paused' });
    }
  },

  resumeGame: () => {
    const { status } = get();
    if (status === 'paused') {
      set({ status: 'playing' });
    }
  },

  finishGame: () => {
    const { player, elapsedTime } = get();
    const result: GameResult = {
      finalScore: Math.floor(player.distanceTraveled * 10) + (player.armyCount * 100) + (player.coinsCollected * 5),
      coinsCollected: player.coinsCollected,
      maxArmy: player.armyCount,
      distanceTraveled: player.distanceTraveled,
      timeTaken: elapsedTime,
      didFinish: true,
      enemiesKilled: 0,
      perfectGates: 0
    };
    set({ status: 'finished', result });
  },

  gameOver: () => {
    const { player, elapsedTime } = get();
    const result: GameResult = {
      finalScore: Math.floor(player.distanceTraveled * 10),
      coinsCollected: 0,
      maxArmy: 0,
      distanceTraveled: player.distanceTraveled,
      timeTaken: elapsedTime,
      didFinish: false,
      enemiesKilled: 0,
      perfectGates: 0
    };
    set({ status: 'gameover', result });
  },

  updateTime: (delta) => {
    const { elapsedTime, countdown, status, activeSpeedEffect } = get();

    if (status === 'countdown') {
      const newCountdown = countdown - delta;
      if (newCountdown <= 0) {
        set({ countdown: 0, status: 'playing' });
      } else {
        set({ countdown: newCountdown });
      }
    } else if (status === 'playing') {
      // Update elapsed time
      const newElapsedTime = elapsedTime + delta;

      // Check if speed effect has expired
      if (activeSpeedEffect) {
        const effectElapsed = (newElapsedTime - activeSpeedEffect.startTime) * 1000;
        if (effectElapsed >= activeSpeedEffect.remainingTime) {
          // Effect expired
          set({
            elapsedTime: newElapsedTime,
            speedMultiplier: 1.0,
            activeSpeedEffect: null,
          });
          return;
        }
      }

      set({ elapsedTime: newElapsedTime });
    }
  },

  reset: () => {
    set({
      status: 'idle',
      gameMode: 'solo',
      player: { ...initialPlayerState },
      track: null,
      elapsedTime: 0,
      countdown: 3,
      result: null,
      speedMultiplier: 1.0,
      activeSpeedEffect: null,
    });
  },

  // Gate effect actions
  setSpeedMultiplier: (multiplier, effectType, duration) => {
    const { elapsedTime } = get();
    set({
      speedMultiplier: multiplier,
      activeSpeedEffect: {
        type: effectType,
        remainingTime: duration,
        startTime: elapsedTime,
      },
    });
  },

  clearSpeedEffect: () => {
    set({
      speedMultiplier: 1.0,
      activeSpeedEffect: null,
    });
  },

  multiplyArmy: (multiplier) => {
    const { player } = get();
    set({
      player: {
        ...player,
        armyCount: Math.floor(player.armyCount * multiplier),
      },
    });
  },

  divideArmy: (divisor) => {
    const { player } = get();
    set({
      player: {
        ...player,
        armyCount: Math.max(1, Math.floor(player.armyCount / divisor)), // Minimum 1
      },
    });
  },

  // Coin collection
  collectCoin: (value: number = 1) => {
    const { player } = get();
    set({
      player: {
        ...player,
        coinsCollected: player.coinsCollected + value,
      },
    });
  },
  collectGate: () => {},
  damageArmy: () => {},
  addSoldiers: (count: number) => {
    const { player } = get();
    set({
      player: {
        ...player,
        armyCount: player.armyCount + count,
      },
    });
  },
  multiplySoldiers: (multiplier: number) => {
    const { player } = get();
    set({
      player: {
        ...player,
        armyCount: Math.floor(player.armyCount * multiplier),
      },
    });
  },
  activatePowerUp: () => {},
  updatePowerUps: () => {},
  killEnemy: () => {},
  perfectGate: () => {},
  updateOpponent: () => {},
}));

// Selectors
export const selectPlayerLane = (state: GameState) => state.player.lane;
export const selectPlayerArmy = (state: GameState) => state.player.armyCount;
export const selectPlayerScore = (state: GameState) => state.player.score;
export const selectPlayerCoins = (state: GameState) => state.player.coinsCollected;
export const selectGameStatus = (state: GameState) => state.status;
export const selectActivePowerUps = (state: GameState) => state.activePowerUps;
export const selectSpeedMultiplier = (state: GameState) => state.speedMultiplier;
export const selectActiveSpeedEffect = (state: GameState) => state.activeSpeedEffect;
