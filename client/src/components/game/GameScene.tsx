import { useEffect, useMemo, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';

import Player from './Player';
import Track, { Environment } from './Track';
import GameCamera from './GameCamera';
import { FPSDisplay } from './FPSMonitor';
import { SoldierPickups, generateSoldiers, SoldierPickupData } from './SoldierPickup';
import { ArmyFollowers } from './ArmyFollowers';
import { GatesRenderer } from './Gates';
import {
  SimpleGateType,
  GateData,
  generateGates,
  SPEED_EFFECT_DURATION,
  SPEED_BOOST_MULTIPLIER,
  SPEED_SLOW_MULTIPLIER,
} from './gateTypes';

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
    updateTime,
    addSoldiers,
    setSpeedMultiplier,
    multiplyArmy,
    divideArmy,
  } = useGameStore();

  const { graphicsQuality, isVibrationEnabled } = useUIStore();

  // Soldier pickups state
  const [soldiers, setSoldiers] = useState<SoldierPickupData[]>([]);

  // Gates state
  const [gates, setGates] = useState<GateData[]>([]);

  // Initialize game with simplified track and soldiers
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

    // Generate soldiers on the track
    setSoldiers(generateSoldiers(TRACK_LENGTH));

    // Generate gates on the track
    setGates(generateGates(TRACK_LENGTH));

    // Start countdown after brief delay
    setTimeout(() => {
      startCountdown();
    }, 500);
  }, [mode, trackSeed, initGame, startCountdown]);

  // Game loop - update time only (finish is handled in Player component)
  useEffect(() => {
    if (status !== 'playing' && status !== 'countdown') return;

    let lastTime = performance.now();
    let animationId: number;

    const gameLoop = () => {
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      updateTime(delta);

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [status, updateTime]);

  // Handle soldier collection
  const handleSoldierCollect = useCallback((soldierId: string) => {
    // Mark soldier as collected
    setSoldiers(prev =>
      prev.map(s =>
        s.id === soldierId
          ? { ...s, isCollected: true }
          : s
      )
    );

    // Add to army
    addSoldiers(1);

    // Haptic feedback
    if (isVibrationEnabled) {
      vibrate(15);
    }
  }, [addSoldiers, isVibrationEnabled]);

  // Handle gate trigger
  const handleGateTrigger = useCallback((gateId: string, gateType: SimpleGateType) => {
    // Mark gate as triggered
    setGates(prev =>
      prev.map(g =>
        g.id === gateId
          ? { ...g, isTriggered: true }
          : g
      )
    );

    // Apply gate effect
    switch (gateType) {
      case SimpleGateType.SPEED_BOOST:
        setSpeedMultiplier(SPEED_BOOST_MULTIPLIER, 'boost', SPEED_EFFECT_DURATION);
        break;
      case SimpleGateType.SPEED_SLOW:
        setSpeedMultiplier(SPEED_SLOW_MULTIPLIER, 'slow', SPEED_EFFECT_DURATION);
        break;
      case SimpleGateType.MULTIPLY_ARMY:
        multiplyArmy(2);
        break;
      case SimpleGateType.REDUCE_ARMY:
        divideArmy(2);
        break;
    }

    // Haptic feedback for gates
    if (isVibrationEnabled) {
      vibrate(30);
    }
  }, [setSpeedMultiplier, multiplyArmy, divideArmy, isVibrationEnabled]);

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

  // Calculate army size (player starts with 1)
  const armySize = player.armyCount - 1; // Subtract 1 because player is the "leader"

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

        {/* Gates on track */}
        <GatesRenderer gates={gates} onGateTrigger={handleGateTrigger} armySize={armySize} />

        {/* Soldier pickups on track */}
        <SoldierPickups
          soldiers={soldiers}
          onCollect={handleSoldierCollect}
        />

        {/* Army following player (snake formation) */}
        <ArmyFollowers armySize={armySize} />

        {/* Player with smooth movement */}
        <Player />
      </Canvas>
    </div>
  );
}
