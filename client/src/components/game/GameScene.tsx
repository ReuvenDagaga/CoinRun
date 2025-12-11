import { useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import * as THREE from 'three';

import Player from './Player';
import Track, { Environment } from './Track';
import { ArmyInstanced } from './Army';
import { GatesRenderer } from './Gate';
import { CoinsRenderer } from './Coin';
import { EnemiesRenderer } from './Enemy';
import { ObstaclesRenderer } from './Obstacle';
import { PowerUpEffects, BulletSystem } from './PowerUp';
import GameCamera from './GameCamera';
import { FPSDisplay } from './FPSMonitor';

import { useGameStore } from '@/store/gameStore';
import { useUserStore } from '@/store/userStore';
import { useUIStore, showFloatingText, showNotification } from '@/store/uiStore';
import { useSwipeDetector, vibrate } from '@/utils/swipeDetector';
import { generateTrack, generateSeed } from '@/utils/trackGenerator';
import { GateType } from '@shared/types/game.types';
import type { GateState, CoinState, EnemyState, ObstacleState } from '@shared/types/game.types';
import { CLIENT_CONSTANTS } from '@/utils/constants';

interface GameSceneProps {
  mode: 'solo' | '1v1';
  trackSeed?: string;
}

export default function GameScene({ mode, trackSeed }: GameSceneProps) {
  const {
    status,
    track,
    player,
    initGame,
    handleSwipe,
    stopHorizontalMovement,
    collectCoin,
    collectGate,
    damageArmy,
    killEnemy,
    startCountdown,
    startGame,
    finishGame,
    updateTime,
    updatePowerUps
  } = useGameStore();

  const user = useUserStore((state) => state.user);
  const { graphicsQuality, isVibrationEnabled } = useUIStore();

  // Initialize game
  useEffect(() => {
    const seed = trackSeed || generateSeed();
    const difficulty = user?.stats.gamesPlayed ? Math.min(user.stats.gamesPlayed / 10, 5) : 1;
    const generatedTrack = generateTrack(seed, difficulty);

    initGame(mode, generatedTrack, {
      capacity: user?.upgrades.capacity || 0,
      addWarrior: user?.upgrades.addWarrior || 0,
      speed: user?.upgrades.speed || 0
    });

    // Start countdown after a brief delay
    setTimeout(() => {
      startCountdown();
    }, 500);
  }, [mode, trackSeed]);

  // Game loop - update time
  useEffect(() => {
    if (status !== 'playing' && status !== 'countdown') return;

    let lastTime = performance.now();
    let animationId: number;

    const gameLoop = () => {
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      updateTime(delta);
      updatePowerUps(delta);

      // Check for finish
      if (status === 'playing' && track && player.distanceTraveled >= track.totalLength - 5) {
        finishGame();
      }

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [status, track, player.distanceTraveled, updateTime, updatePowerUps, finishGame]);

  // Swipe controls with continuous movement support
  useSwipeDetector({
    minSwipeDistance: CLIENT_CONSTANTS.MIN_SWIPE_DISTANCE,
    maxSwipeTime: CLIENT_CONSTANTS.MAX_SWIPE_TIME,
    onSwipe: (direction) => {
      if (status === 'playing') {
        handleSwipe(direction);
        if (isVibrationEnabled) {
          vibrate(10);
        }
      }
    },
    onSwipeEnd: () => {
      if (status === 'playing') {
        stopHorizontalMovement();
      }
    }
  });

  // Coin collection handler
  const handleCoinCollect = useCallback((coin: CoinState) => {
    collectCoin(coin.value);
    showFloatingText(`+${coin.value}`, 50, 30, 'coin');
    if (isVibrationEnabled) vibrate(5);
  }, [collectCoin, isVibrationEnabled]);

  // Gate collection handler
  const handleGateCollect = useCallback((gate: GateState) => {
    collectGate(gate.type, gate.value);

    let text = '';
    switch (gate.type) {
      case GateType.ADD:
        text = `+${gate.value} soldiers`;
        break;
      case GateType.MULTIPLY:
        text = `x${gate.value} soldiers!`;
        break;
      case GateType.SPEED:
        text = 'SPEED BOOST!';
        break;
      case GateType.SHIELD:
        text = 'SHIELD ACTIVE!';
        break;
      case GateType.MAGNET:
        text = 'MAGNET ACTIVE!';
        break;
      case GateType.BULLETS:
        text = 'BULLETS ACTIVE!';
        break;
    }

    showFloatingText(text, 50, 40, gate.type === GateType.ADD || gate.type === GateType.MULTIPLY ? 'soldier' : 'powerup');
    if (isVibrationEnabled) vibrate([10, 10, 10]);
  }, [collectGate, isVibrationEnabled]);

  // Enemy defeat handler
  const handleEnemyDefeat = useCallback((enemy: EnemyState) => {
    killEnemy(enemy.reward);
    showFloatingText(`+${enemy.reward}`, 50, 35, 'score');
    if (isVibrationEnabled) vibrate(20);
  }, [killEnemy, isVibrationEnabled]);

  // Damage handler
  const handleDamage = useCallback((damage: number) => {
    damageArmy(damage);
    showFloatingText(`-${damage}`, 50, 25, 'damage');
    if (isVibrationEnabled) vibrate([50, 50, 50]);
  }, [damageArmy, isVibrationEnabled]);

  // Obstacle collision handler
  const handleObstacleCollision = useCallback((obstacle: ObstacleState) => {
    if (obstacle.type === 'gap') {
      handleDamage(5);
    } else if (obstacle.type === 'wall') {
      handleDamage(1);
    }
  }, [handleDamage]);

  // Get all objects from track sections
  const { allGates, allCoins, allEnemies, allObstacles } = useMemo(() => {
    if (!track) return { allGates: [], allCoins: [], allEnemies: [], allObstacles: [] };

    return {
      allGates: track.sections.flatMap(s => s.gates),
      allCoins: track.sections.flatMap(s => s.coins),
      allEnemies: track.sections.flatMap(s => s.enemies),
      allObstacles: track.sections.flatMap(s => s.obstacles)
    };
  }, [track]);

  // Graphics settings based on quality - optimized for 60 FPS
  const graphicsSettings = useMemo(() => {
    switch (graphicsQuality) {
      case 'low':
        return {
          shadows: false,
          pixelRatio: 0.75,
          antialias: false,
          physicsTimestep: 1/30
        };
      case 'high':
        return {
          shadows: true,
          pixelRatio: Math.min(window.devicePixelRatio, 2),
          antialias: true,
          physicsTimestep: 1/60
        };
      default: // medium
        return {
          shadows: true,
          pixelRatio: Math.min(window.devicePixelRatio, 1.5),
          antialias: true,
          physicsTimestep: 1/60
        };
    }
  }, [graphicsQuality]);

  if (!track) return null;

  // Show FPS counter in dev/debug mode
  const showFPS = graphicsQuality === 'high' || process.env.NODE_ENV === 'development';

  return (
    <div className="w-full h-full touch-none relative">
      {/* FPS Counter overlay */}
      {showFPS && <FPSDisplay show={true} />}

      <Canvas
        shadows={graphicsSettings.shadows}
        dpr={graphicsSettings.pixelRatio}
        gl={{
          antialias: graphicsSettings.antialias,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true
        }}
        frameloop="always"
        performance={{ min: 0.5 }}
      >
        <Physics
          gravity={[0, -20, 0]}
          timeStep={1/60}
          maxStabilizationIterations={1}
          maxVelocityIterations={1}
        >
          {/* Camera */}
          <GameCamera target={player.position} />

          {/* Environment */}
          <Environment />

          {/* Track */}
          <Track />

          {/* Player */}
          <Player />

          {/* Army */}
          <ArmyInstanced />

          {/* Power-up effects */}
          <PowerUpEffects />

          {/* Bullet System - Continuous shooting */}
          <BulletSystem />

          {/* Gates */}
          <GatesRenderer gates={allGates} onCollect={handleGateCollect} />

          {/* Coins */}
          <CoinsRenderer coins={allCoins} onCollect={handleCoinCollect} />

          {/* Enemies */}
          <EnemiesRenderer
            enemies={allEnemies}
            onDefeat={handleEnemyDefeat}
            onDamagePlayer={handleDamage}
          />

          {/* Obstacles */}
          <ObstaclesRenderer
            obstacles={allObstacles}
            onCollision={handleObstacleCollision}
          />
        </Physics>
      </Canvas>
    </div>
  );
}
