import { useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';

import Player from './Player';
import Track, { Environment } from './Track';
import GameCamera from './GameCamera';
import { FPSDisplay } from './FPSMonitor';

import { useGameStore } from '@/store/gameStore';
import { useUIStore } from '@/store/uiStore';
import { useSwipeDetector, vibrate } from '@/utils/swipeDetector';
import { CLIENT_CONSTANTS } from '@/utils/constants';

// Simple track data for core mechanics
const TRACK_LENGTH = 800;

interface GameSceneProps {
  mode: 'solo' | '1v1';
  trackSeed?: string;
}

export default function GameScene({ mode, trackSeed }: GameSceneProps) {
  const {
    status,
    player,
    initGame,
    handleSwipe,
    stopHorizontalMovement,
    startCountdown,
    finishGame,
    updateTime,
  } = useGameStore();

  const { graphicsQuality, isVibrationEnabled } = useUIStore();

  // Initialize game with simplified track
  useEffect(() => {
    const seed = trackSeed || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Create minimal track data
    const simpleTrack = {
      seed,
      difficulty: 1,
      sections: [
        { type: 'intro' as const, startZ: 0, endZ: TRACK_LENGTH, enemies: [], gates: [], obstacles: [], coins: [] }
      ],
      totalLength: TRACK_LENGTH,
    };

    initGame(mode, simpleTrack as any, {
      capacity: 0,
      addWarrior: 0,
      speed: 0
    });

    // Start countdown after brief delay
    setTimeout(() => {
      startCountdown();
    }, 500);
  }, [mode, trackSeed, initGame, startCountdown]);

  // Game loop - update time and check finish
  useEffect(() => {
    if (status !== 'playing' && status !== 'countdown') return;

    let lastTime = performance.now();
    let animationId: number;

    const gameLoop = () => {
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      updateTime(delta);

      // Check for finish (800m)
      if (status === 'playing' && player.distanceTraveled >= TRACK_LENGTH - 5) {
        finishGame();
      }

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [status, player.distanceTraveled, updateTime, finishGame]);

  // Swipe/keyboard controls
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

  // Graphics settings based on quality
  const graphicsSettings = useMemo(() => {
    switch (graphicsQuality) {
      case 'low':
        return {
          shadows: false,
          pixelRatio: 0.75,
          antialias: false,
        };
      case 'high':
        return {
          shadows: true,
          pixelRatio: Math.min(window.devicePixelRatio, 2),
          antialias: true,
        };
      default: // medium
        return {
          shadows: true,
          pixelRatio: Math.min(window.devicePixelRatio, 1.5),
          antialias: true,
        };
    }
  }, [graphicsQuality]);

  // Show FPS in development or high quality mode
  const showFPS = graphicsQuality === 'high' || import.meta.env.DEV;

  return (
    <div className="w-full h-full touch-none relative">
      {/* FPS Counter */}
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
        {/* Camera - follows player smoothly */}
        <GameCamera target={player.position} />

        {/* Environment - sky, ground, lighting */}
        <Environment />

        {/* Track with random textures and finish line */}
        <Track />

        {/* Player with smooth movement */}
        <Player />
      </Canvas>
    </div>
  );
}
