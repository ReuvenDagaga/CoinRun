import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';

import Player from './Player';
import Track from './Track/Track';
import Environment from './Track/Environment/Environment';
import GameCamera from './GameCamera';
import { FPSDisplay } from './FPSMonitor';
import { SoldierPickups, generateSoldiers, SoldierPickupData } from './SoldierPickup';
import { ArmyFollowers } from './ArmyFollowers';
import { GatesRenderer } from './Track/Environment/Gates';
import {
  SimpleGateType,
  GateData,
  generateGates,
  SPEED_EFFECT_DURATION,
  SPEED_BOOST_MULTIPLIER,
  SPEED_SLOW_MULTIPLIER,
  SUPER_SLOW_MULTIPLIER,
  SHIELD_DURATION,
  DOUBLE_POINTS_DURATION,
  MAGNET_DURATION,
  GIANT_DURATION,
  REVERSE_CONTROLS_DURATION,
  SHRINK_DURATION,
} from './Track/Environment/types';
import { CoinsRenderer, CoinData, generateCoins } from './coin';
import { useGame, useUI } from '@/context';
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
    collectCoin,
    setSpeedMultiplier,
    multiplyArmy,
    divideArmy,
    activateShield,
    activateDoublePoints,
    activateMagnet,
    activateGiant,
    activateReverseControls,
    activateShrink,
  } = useGame();

  const { graphicsQuality, isVibrationEnabled } = useUI();

  // Soldier pickups state
  const [soldiers, setSoldiers] = useState<SoldierPickupData[]>([]);

  // Gates state - use stable array + Set for triggered IDs to avoid re-renders
  const [gates, setGates] = useState<GateData[]>([]);
  const triggeredGateIds = useRef<Set<string>>(new Set());

  // Coins state
  const [coins, setCoins] = useState<CoinData[]>([]);

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

    // Generate gates on the track and reset triggered set
    triggeredGateIds.current.clear();
    setGates(generateGates(TRACK_LENGTH));

    // Generate coins on the track
    setCoins(generateCoins(TRACK_LENGTH));

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

  // Handle gate trigger - uses ref to track triggered IDs to avoid re-renders
  const handleGateTrigger = useCallback((gateId: string, gateType: SimpleGateType) => {
    // Track triggered gate in Set (doesn't cause re-render)
    // The SingleGate component manages its own visual state via isTriggeredRef
    triggeredGateIds.current.add(gateId);

    // Apply gate effect
    switch (gateType) {
      case SimpleGateType.ADD_SOLDIERS:
        addSoldiers(5);
        break;
      case SimpleGateType.SUBTRACT_SOLDIERS:
        addSoldiers(-3);
        break;
      case SimpleGateType.MULTIPLY_SOLDIERS:
        multiplyArmy(2);
        break;
      case SimpleGateType.DIVIDE_SOLDIERS:
        divideArmy(2);
        break;
      case SimpleGateType.SPEED_BOOST:
        setSpeedMultiplier(SPEED_BOOST_MULTIPLIER, 'boost', SPEED_EFFECT_DURATION);
        break;
      case SimpleGateType.SLOW_DOWN:
        setSpeedMultiplier(SPEED_SLOW_MULTIPLIER, 'slow', SPEED_EFFECT_DURATION);
        break;
      case SimpleGateType.SHIELD:
        activateShield(SHIELD_DURATION);
        break;
      case SimpleGateType.DOUBLE_POINTS:
        activateDoublePoints(DOUBLE_POINTS_DURATION);
        break;
      case SimpleGateType.MAGNET:
        activateMagnet(MAGNET_DURATION);
        break;
      case SimpleGateType.GIANT:
        activateGiant(GIANT_DURATION);
        break;
      // Additional negative gates
      case SimpleGateType.SUPER_SLOW:
        setSpeedMultiplier(SUPER_SLOW_MULTIPLIER, 'slow', SPEED_EFFECT_DURATION);
        break;
      case SimpleGateType.SUBTRACT_SOLDIERS_5:
        addSoldiers(-5);
        break;
      case SimpleGateType.SUBTRACT_SOLDIERS_10:
        addSoldiers(-10);
        break;
      case SimpleGateType.DIVIDE_SOLDIERS_3:
        divideArmy(3);
        break;
      case SimpleGateType.REVERSE_CONTROLS:
        activateReverseControls(REVERSE_CONTROLS_DURATION);
        break;
      case SimpleGateType.SHRINK:
        activateShrink(SHRINK_DURATION);
        break;
    }

    // Haptic feedback for gates
    if (isVibrationEnabled) {
      vibrate(30);
    }
  }, [setSpeedMultiplier, multiplyArmy, divideArmy, addSoldiers, activateShield, activateDoublePoints, activateMagnet, activateGiant, activateReverseControls, activateShrink, isVibrationEnabled]);

  // Handle coin collection
  const handleCoinCollect = useCallback((coinId: string) => {
    // Mark coin as collected
    setCoins(prev =>
      prev.map(c =>
        c.id === coinId
          ? { ...c, isCollected: true }
          : c
      )
    );

    // Add to coin count
    collectCoin(1);

    // Light haptic feedback
    if (isVibrationEnabled) {
      vibrate(5);
    }
  }, [collectCoin, isVibrationEnabled]);

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

        {/* Coins on track */}
        <CoinsRenderer coins={coins} onCoinCollect={handleCoinCollect} armySize={armySize} />

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
