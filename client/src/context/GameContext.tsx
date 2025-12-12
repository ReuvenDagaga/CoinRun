import { createContext, useContext, useState, useMemo, ReactNode, useCallback } from 'react';
import type {
  PlayerState,
  TrackData,
  GameResult,
  SwipeDirection,
} from '@shared/types/game.types';

export interface SpeedEffect {
  type: 'boost' | 'slow';
  remainingTime: number;
  startTime: number;
}

interface GameContextValue {
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

  // Speed multiplier from gates
  speedMultiplier: number;
  activeSpeedEffect: SpeedEffect | null;

  // For backward compatibility
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

const GameContext = createContext<GameContextValue | undefined>(undefined);

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

interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const [status, setStatus] = useState<GameContextValue['status']>('idle');
  const [gameMode, setGameMode] = useState<'solo' | '1v1'>('solo');
  const [player, setPlayer] = useState<PlayerState>({ ...initialPlayerState });
  const [track, setTrack] = useState<TrackData | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [result, setResult] = useState<GameResult | null>(null);
  const [speedMultiplier, setSpeedMultiplierState] = useState(1.0);
  const [activeSpeedEffect, setActiveSpeedEffect] = useState<SpeedEffect | null>(null);
  const [activePowerUps] = useState<Array<{ type: string; remainingTime: number }>>([]);
  const [opponent] = useState(null);
  const [opponentProgress] = useState(0);

  const initGame = useCallback((mode: 'solo' | '1v1', trackData: TrackData, _upgrades: { capacity: number; addWarrior: number; speed: number }) => {
    setStatus('loading');
    setGameMode(mode);
    setTrack(trackData);
    setPlayer({
      ...initialPlayerState,
      id: 'player-' + Date.now(),
      armyCount: 1,
      horizontalVelocity: 0,
    });
    setElapsedTime(0);
    setCountdown(3);
    setResult(null);
    setSpeedMultiplierState(1.0);
    setActiveSpeedEffect(null);
  }, []);

  const handleSwipe = useCallback((direction: SwipeDirection) => {
    if (status !== 'playing') return;

    if (direction === 'left') {
      setPlayer(prev => ({
        ...prev,
        horizontalVelocity: -1
      }));
    } else if (direction === 'right') {
      setPlayer(prev => ({
        ...prev,
        horizontalVelocity: 1
      }));
    }
  }, [status]);

  const stopHorizontalMovement = useCallback(() => {
    setPlayer(prev => ({
      ...prev,
      horizontalVelocity: 0
    }));
  }, []);

  const updatePlayerPosition = useCallback((z: number, x?: number) => {
    setPlayer(prev => ({
      ...prev,
      position: {
        ...prev.position,
        z,
        ...(x !== undefined && { x })
      },
      distanceTraveled: z
    }));
  }, []);

  const startCountdown = useCallback(() => {
    setStatus('countdown');
    setCountdown(3);
  }, []);

  const startGame = useCallback(() => {
    setStatus('playing');
  }, []);

  const pauseGame = useCallback(() => {
    if (status === 'playing') {
      setStatus('paused');
    }
  }, [status]);

  const resumeGame = useCallback(() => {
    if (status === 'paused') {
      setStatus('playing');
    }
  }, [status]);

  const finishGame = useCallback(() => {
    const gameResult: GameResult = {
      finalScore: Math.floor(player.distanceTraveled * 10) + (player.armyCount * 100) + (player.coinsCollected * 5),
      coinsCollected: player.coinsCollected,
      maxArmy: player.armyCount,
      distanceTraveled: player.distanceTraveled,
      timeTaken: elapsedTime,
      didFinish: true,
      enemiesKilled: 0,
      perfectGates: 0
    };
    setStatus('finished');
    setResult(gameResult);
  }, [player, elapsedTime]);

  const gameOver = useCallback(() => {
    const gameResult: GameResult = {
      finalScore: Math.floor(player.distanceTraveled * 10),
      coinsCollected: 0,
      maxArmy: 0,
      distanceTraveled: player.distanceTraveled,
      timeTaken: elapsedTime,
      didFinish: false,
      enemiesKilled: 0,
      perfectGates: 0
    };
    setStatus('gameover');
    setResult(gameResult);
  }, [player, elapsedTime]);

  const updateTime = useCallback((delta: number) => {
    if (status === 'countdown') {
      setCountdown(prev => {
        const newCountdown = prev - delta;
        if (newCountdown <= 0) {
          setStatus('playing');
          return 0;
        }
        return newCountdown;
      });
    } else if (status === 'playing') {
      setElapsedTime(prev => {
        const newElapsedTime = prev + delta;

        // Check if speed effect has expired
        if (activeSpeedEffect) {
          const effectElapsed = (newElapsedTime - activeSpeedEffect.startTime) * 1000;
          if (effectElapsed >= activeSpeedEffect.remainingTime) {
            setSpeedMultiplierState(1.0);
            setActiveSpeedEffect(null);
          }
        }

        return newElapsedTime;
      });
    }
  }, [status, activeSpeedEffect]);

  const reset = useCallback(() => {
    setStatus('idle');
    setGameMode('solo');
    setPlayer({ ...initialPlayerState });
    setTrack(null);
    setElapsedTime(0);
    setCountdown(3);
    setResult(null);
    setSpeedMultiplierState(1.0);
    setActiveSpeedEffect(null);
  }, []);

  const handleSetSpeedMultiplier = useCallback((multiplier: number, effectType: 'boost' | 'slow', duration: number) => {
    setSpeedMultiplierState(multiplier);
    setActiveSpeedEffect({
      type: effectType,
      remainingTime: duration,
      startTime: elapsedTime,
    });
  }, [elapsedTime]);

  const clearSpeedEffect = useCallback(() => {
    setSpeedMultiplierState(1.0);
    setActiveSpeedEffect(null);
  }, []);

  const multiplyArmy = useCallback((multiplier: number) => {
    setPlayer(prev => ({
      ...prev,
      armyCount: Math.floor(prev.armyCount * multiplier),
    }));
  }, []);

  const divideArmy = useCallback((divisor: number) => {
    setPlayer(prev => ({
      ...prev,
      armyCount: Math.max(1, Math.floor(prev.armyCount / divisor)),
    }));
  }, []);

  const collectCoin = useCallback((value: number = 1) => {
    setPlayer(prev => ({
      ...prev,
      coinsCollected: prev.coinsCollected + value,
    }));
  }, []);

  const addSoldiers = useCallback((count: number) => {
    setPlayer(prev => ({
      ...prev,
      armyCount: prev.armyCount + count,
    }));
  }, []);

  const multiplySoldiers = useCallback((multiplier: number) => {
    setPlayer(prev => ({
      ...prev,
      armyCount: Math.floor(prev.armyCount * multiplier),
    }));
  }, []);

  // Stub functions for compatibility
  const collectGate = useCallback(() => {}, []);
  const damageArmy = useCallback(() => {}, []);
  const activatePowerUp = useCallback(() => {}, []);
  const updatePowerUps = useCallback(() => {}, []);
  const killEnemy = useCallback(() => {}, []);
  const perfectGate = useCallback(() => {}, []);
  const updateOpponent = useCallback(() => {}, []);

  const value = useMemo(
    () => ({
      status,
      gameMode,
      player,
      track,
      elapsedTime,
      countdown,
      result,
      speedMultiplier,
      activeSpeedEffect,
      activePowerUps,
      opponent,
      opponentProgress,
      initGame,
      handleSwipe,
      stopHorizontalMovement,
      updatePlayerPosition,
      startCountdown,
      startGame,
      pauseGame,
      resumeGame,
      finishGame,
      gameOver,
      updateTime,
      reset,
      setSpeedMultiplier: handleSetSpeedMultiplier,
      clearSpeedEffect,
      multiplyArmy,
      divideArmy,
      collectCoin,
      collectGate,
      damageArmy,
      addSoldiers,
      multiplySoldiers,
      activatePowerUp,
      updatePowerUps,
      killEnemy,
      perfectGate,
      updateOpponent,
    }),
    [
      status,
      gameMode,
      player,
      track,
      elapsedTime,
      countdown,
      result,
      speedMultiplier,
      activeSpeedEffect,
      activePowerUps,
      opponent,
      opponentProgress,
      initGame,
      handleSwipe,
      stopHorizontalMovement,
      updatePlayerPosition,
      startCountdown,
      startGame,
      pauseGame,
      resumeGame,
      finishGame,
      gameOver,
      updateTime,
      reset,
      handleSetSpeedMultiplier,
      clearSpeedEffect,
      multiplyArmy,
      divideArmy,
      collectCoin,
      collectGate,
      damageArmy,
      addSoldiers,
      multiplySoldiers,
      activatePowerUp,
      updatePowerUps,
      killEnemy,
      perfectGate,
      updateOpponent,
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

// Selectors for compatibility with old code
export const selectPlayerLane = (player: PlayerState) => player.lane;
export const selectPlayerArmy = (player: PlayerState) => player.armyCount;
export const selectPlayerScore = (player: PlayerState) => player.score;
export const selectPlayerCoins = (player: PlayerState) => player.coinsCollected;
