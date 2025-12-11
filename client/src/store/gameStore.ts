import { create } from 'zustand';
import type {
  PlayerState,
  TrackData,
  GameResult,
  SwipeDirection,
  GateType,
  PowerUpState
} from '@shared/types/game.types';
import {
  GAME_CONSTANTS,
  getStartingArmy,
  getMaxArmy,
  getPlayerSpeed,
  calculateScore
} from '@shared/types/game.types';

interface GameState {
  // Game status
  status: 'idle' | 'loading' | 'countdown' | 'playing' | 'paused' | 'finished' | 'gameover';
  gameMode: 'solo' | '1v1';

  // Player state
  player: PlayerState;

  // Track
  track: TrackData | null;

  // Game progress
  elapsedTime: number;
  countdown: number;

  // Results
  result: GameResult | null;

  // Opponent (1v1 mode)
  opponent: PlayerState | null;
  opponentProgress: number;

  // Power-ups
  activePowerUps: PowerUpState[];

  // Actions
  initGame: (mode: 'solo' | '1v1', track: TrackData, upgrades: { capacity: number; addWarrior: number; speed: number }) => void;
  handleSwipe: (direction: SwipeDirection) => void;
  stopHorizontalMovement: () => void;
  updatePlayerPosition: (z: number, x?: number) => void;
  collectCoin: (value: number) => void;
  collectGate: (type: GateType, value: number) => void;
  damageArmy: (damage: number) => void;
  addSoldiers: (count: number) => void;
  multiplySoldiers: (multiplier: number) => void;
  activatePowerUp: (type: GateType, duration: number) => void;
  updatePowerUps: (delta: number) => void;
  killEnemy: (reward: number) => void;
  perfectGate: () => void;
  startCountdown: () => void;
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  finishGame: () => void;
  gameOver: () => void;
  updateTime: (delta: number) => void;
  updateOpponent: (progress: number, armyCount: number) => void;
  reset: () => void;
}

const initialPlayerState: PlayerState = {
  id: '',
  position: { x: 0, y: 0, z: 0 },
  lane: 1, // Legacy, kept for compatibility
  horizontalVelocity: 0, // -1 (left), 0 (none), 1 (right) for free movement
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
  opponent: null,
  opponentProgress: 0,
  activePowerUps: [],

  initGame: (mode, track, upgrades) => {
    const startingArmy = getStartingArmy(upgrades.addWarrior);
    set({
      status: 'loading',
      gameMode: mode,
      track,
      player: {
        ...initialPlayerState,
        id: 'player-' + Date.now(),
        armyCount: startingArmy,
        horizontalVelocity: 0,
        activePowerUps: []
      },
      elapsedTime: 0,
      countdown: 3,
      result: null,
      opponent: mode === '1v1' ? { ...initialPlayerState, id: 'opponent', horizontalVelocity: 0 } : null,
      opponentProgress: 0,
      activePowerUps: []
    });
  },

  handleSwipe: (direction) => {
    const { status, player } = get();
    if (status !== 'playing') return;

    // Free horizontal movement system
    if (direction === 'left') {
      set({
        player: {
          ...player,
          horizontalVelocity: -1 // Move left
        }
      });
    } else if (direction === 'right') {
      set({
        player: {
          ...player,
          horizontalVelocity: 1 // Move right
        }
      });
    } else if (direction === 'up' && !player.isJumping) {
      set({
        player: {
          ...player,
          isJumping: true
        }
      });
      // Jump will be handled by physics, reset after landing
    }
  },

  // New: Stop horizontal movement (called when touch ends)
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

  collectCoin: (value) => {
    const { player } = get();
    set({
      player: {
        ...player,
        coinsCollected: player.coinsCollected + value,
        score: player.score + value
      }
    });
  },

  collectGate: (type, value) => {
    const state = get();
    if (type === 'add') {
      state.addSoldiers(value);
    } else if (type === 'multiply') {
      state.multiplySoldiers(value);
    } else {
      // Power-up gates
      const durations: Record<string, number> = {
        speed: 5,
        shield: 10,
        magnet: 15,
        bullets: 30
      };
      state.activatePowerUp(type, durations[type] || 10);
    }
  },

  damageArmy: (damage) => {
    const { player, status } = get();
    const newArmyCount = Math.max(0, player.armyCount - damage);

    if (newArmyCount <= 0) {
      set({
        player: { ...player, armyCount: 0 }
      });
      get().gameOver();
    } else {
      set({
        player: { ...player, armyCount: newArmyCount }
      });
    }
  },

  addSoldiers: (count) => {
    const { player } = get();
    // Note: maxArmy should be calculated based on user upgrades
    const maxArmy = 130; // Will be updated based on upgrades
    set({
      player: {
        ...player,
        armyCount: Math.min(player.armyCount + count, maxArmy)
      }
    });
  },

  multiplySoldiers: (multiplier) => {
    const { player } = get();
    const maxArmy = 130;
    set({
      player: {
        ...player,
        armyCount: Math.min(Math.floor(player.armyCount * multiplier), maxArmy)
      }
    });
  },

  activatePowerUp: (type, duration) => {
    const { activePowerUps, player } = get();
    const existing = activePowerUps.findIndex(p => p.type === type);

    if (existing >= 0) {
      // Extend existing power-up
      const updated = [...activePowerUps];
      updated[existing] = { type, remainingTime: duration };
      set({
        activePowerUps: updated,
        player: { ...player, activePowerUps: updated }
      });
    } else {
      // Add new power-up
      const updated = [...activePowerUps, { type, remainingTime: duration }];
      set({
        activePowerUps: updated,
        player: { ...player, activePowerUps: updated }
      });
    }
  },

  updatePowerUps: (delta) => {
    const { activePowerUps, player } = get();
    const updated = activePowerUps
      .map(p => ({ ...p, remainingTime: p.remainingTime - delta }))
      .filter(p => p.remainingTime > 0);

    set({
      activePowerUps: updated,
      player: { ...player, activePowerUps: updated }
    });
  },

  killEnemy: (reward) => {
    const { player } = get();
    set({
      player: {
        ...player,
        score: player.score + reward
      }
    });
  },

  perfectGate: () => {
    const { player } = get();
    set({
      player: {
        ...player,
        score: player.score + 50
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
      finalScore: player.score,
      coinsCollected: player.coinsCollected,
      maxArmy: player.armyCount,
      distanceTraveled: player.distanceTraveled,
      timeTaken: elapsedTime,
      didFinish: true,
      enemiesKilled: 0, // Track this separately
      perfectGates: 0 // Track this separately
    };
    result.finalScore = calculateScore(result);
    set({ status: 'finished', result });
  },

  gameOver: () => {
    const { player, elapsedTime } = get();
    const result: GameResult = {
      finalScore: player.score,
      coinsCollected: player.coinsCollected,
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
    const { elapsedTime, countdown, status } = get();

    if (status === 'countdown') {
      const newCountdown = countdown - delta;
      if (newCountdown <= 0) {
        set({ countdown: 0, status: 'playing' });
      } else {
        set({ countdown: newCountdown });
      }
    } else if (status === 'playing') {
      set({ elapsedTime: elapsedTime + delta });
    }
  },

  updateOpponent: (progress, armyCount) => {
    const { opponent } = get();
    if (opponent) {
      set({
        opponentProgress: progress,
        opponent: { ...opponent, armyCount, distanceTraveled: progress }
      });
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
      opponent: null,
      opponentProgress: 0,
      activePowerUps: []
    });
  }
}));

// Selectors for performance
export const selectPlayerLane = (state: GameState) => state.player.lane;
export const selectPlayerArmy = (state: GameState) => state.player.armyCount;
export const selectPlayerScore = (state: GameState) => state.player.score;
export const selectGameStatus = (state: GameState) => state.status;
export const selectActivePowerUps = (state: GameState) => state.activePowerUps;
