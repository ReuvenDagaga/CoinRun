import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import type { BoulderData } from './Track/Environment/types';
import { Canvas } from '@react-three/fiber';

import Player, { GROUND_Y } from './Player';
import Track from './Track/Track';
import Environment from './Track/Environment/Environment';
import GameCamera from './GameCamera';
import { FPSDisplay } from './FPSMonitor';
import { SoldierPickups, SoldierPickupData } from './SoldierPickup';
import { TieredArmyFollowers, BoulderCollision } from './soldiers/TieredArmyFollowers';
import { GatesRenderer } from './Track/Environment/Gates';
import {
  SimpleGateType,
  GateData,
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
  WEAPON_POWER_DURATION,
  WEAPON_POWER_BASE_BOOST,
  EnemyData,
  GATE_WIDTH,
} from './Track/Environment/types';
import { EnemiesRenderer } from './Track/Environment/Enemies';
import type { DeathInfo } from './Track/Environment/Enemies';
import { DeadSoldiersRenderer, DeadSoldierData } from './DeadSoldier';
import { CoinsRenderer, CoinData } from './coin';
import { useGame, useUI } from '@/context';
import { useSwipeDetector, vibrate } from '@/utils/swipeDetector';
import { CLIENT_CONSTANTS } from '@/utils/constants';
import { useAuth } from '@/hooks/useAuth';
import { GameLoader, PreloadedData, DeadSoldierPool } from './GameLoader';
import { generateTrackLayout } from './TrackLayoutManager';
import { BulletSystem, DamagePopups, DamagePopup } from './weapons/BulletSystem';
import { BulletData, BULLET_LIFETIME, getWeaponTier, WeaponTier, WEAPON_CONFIGS } from './weapons/types';
import { getPlayerSpeed, GAME_CONSTANTS } from '@shared/types/game.types';
import { TRACK_LENGTH } from './Track/config';

// End game components
import { FinishGate, Stairs, StairClimbController, EndGameCamera, Confetti } from './EndGame';

// Performance: limit max bullets to prevent lag with large armies
const MAX_ACTIVE_BULLETS = 150;

// Loading phases
type LoadingPhase = 'loading' | 'ready' | 'playing';

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
    damageArmy,
    killPlayer,
    endGameState,
  } = useGame();

  const { graphicsQuality, isVibrationEnabled } = useUI();
  const { user } = useAuth();

  // Loading phase state
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>('loading');

  // Restart overlay - shown for 3 seconds when restarting to hide ugly transition
  const [showRestartOverlay, setShowRestartOverlay] = useState(() => {
    return sessionStorage.getItem('game_restarting') === 'true';
  });

  // Hide restart overlay after 3 seconds
  useEffect(() => {
    if (showRestartOverlay) {
      const timer = setTimeout(() => {
        setShowRestartOverlay(false);
        sessionStorage.removeItem('game_restarting');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showRestartOverlay]);

  // Soldier pickups state
  const [soldiers, setSoldiers] = useState<SoldierPickupData[]>([]);

  // Gates state - use stable array + Set for triggered IDs to avoid re-renders
  const [gates, setGates] = useState<GateData[]>([]);
  const triggeredGateIds = useRef<Set<string>>(new Set());

  // Coins state
  const [coins, setCoins] = useState<CoinData[]>([]);

  // Enemies state
  const [enemies, setEnemies] = useState<EnemyData[]>([]);

  // Dead soldiers state (for ragdoll physics)
  const [deadSoldiers, setDeadSoldiers] = useState<DeadSoldierData[]>([]);
  const gameTimeRef = useRef(0);

  // Object pool for dead soldiers
  const deadSoldierPoolRef = useRef(new DeadSoldierPool(50));

  // Get current skin for dead soldiers
  const currentSkin = user?.currentSkin || user?.ownedSkins?.[0] || 'default';

  // Bullets state
  const [bullets, setBullets] = useState<BulletData[]>([]);

  // Damage popups state (floating damage numbers)
  const [damagePopups, setDamagePopups] = useState<DamagePopup[]>([]);
  const damagePopupIdCounter = useRef(0);

  // Boulder health tracking (10 hits to destroy)
  const boulderHealthRef = useRef<Map<string, number>>(new Map());

  // Gate enhancement tracking (how much each gate has been improved by bullets)
  // Using BOTH state (for React re-renders) AND ref (for immediate reads)
  const [gateEnhancements, setGateEnhancements] = useState<Map<string, number>>(new Map());
  const gateEnhancementsRef = useRef<Map<string, number>>(new Map());

  // Weapon system state
  const bulletPowerLevel = user?.upgrades?.bulletPower || 0;
  const weaponTier = getWeaponTier(bulletPowerLevel) as WeaponTier;
  const [temporaryWeaponBoost, setTemporaryWeaponBoost] = useState(0);
  const effectiveWeaponTier = Math.min(10, weaponTier + Math.floor(temporaryWeaponBoost)) as WeaponTier;

  // Player speed calculation
  const playerSpeed = getPlayerSpeed(user?.upgrades?.speed || 0);

  // Create a damage popup at a position
  const createDamagePopup = useCallback((position: { x: number; y: number; z: number }, damage: number) => {
    const popup: DamagePopup = {
      id: `damage-${damagePopupIdCounter.current++}`,
      position: { ...position },
      damage: Math.round(damage),
      createdAt: Date.now(),
    };
    setDamagePopups(prev => [...prev, popup]);

    // Remove after 1.5 seconds
    setTimeout(() => {
      setDamagePopups(prev => prev.filter(p => p.id !== popup.id));
    }, 1500);
  }, []);

  // Handle preloaded data from GameLoader
  const handleLoadComplete = useCallback((data: PreloadedData) => {
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

    // Get user upgrade levels (default to 0 if not available)
    const upgrades = {
      capacity: user?.upgrades?.capacity || 0,
      addWarrior: user?.upgrades?.addWarrior || 0,
      speed: user?.upgrades?.speed || 0,
      income: user?.upgrades?.income || 0,
    };

    initGame(mode, simpleTrack as any, upgrades);

    // Use preloaded data
    setSoldiers(data.soldiers);
    triggeredGateIds.current.clear();
    setGates(data.gates);
    setCoins(data.coins);
    setEnemies(data.enemies);

    // Reset bullet system
    setBullets([]);
    boulderHealthRef.current.clear();
    gateEnhancementsRef.current.clear();
    setGateEnhancements(new Map());
    setTemporaryWeaponBoost(0);

    // Transition to ready phase
    setLoadingPhase('ready');
  }, [mode, trackSeed, initGame, user]);

  // Start countdown when ready
  useEffect(() => {
    if (loadingPhase === 'ready') {
      // Brief delay to ensure everything is rendered
      const timer = setTimeout(() => {
        setLoadingPhase('playing');
        startCountdown();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [loadingPhase, startCountdown]);

  // Update bullets and check collisions - COMPLETELY REWRITTEN FROM SCRATCH
  // Key fix: Use refs to always access latest state, not closures
  const gatesRef = useRef(gates);
  const enemiesRef = useRef(enemies);

  // Keep refs up to date
  useEffect(() => {
    gatesRef.current = gates;
    console.log(`[Gates Update] Gates ref updated: ${gates.length} gates`);
  }, [gates]);

  useEffect(() => {
    enemiesRef.current = enemies;
  }, [enemies]);

  const updateBullets = useCallback((delta: number) => {
    const now = Date.now();
    const playerZ = player.position.z;

    // Use refs to get CURRENT values, not stale closures
    const currentGates = gatesRef.current;
    const currentEnemies = enemiesRef.current;

    // Use LOCAL arrays to accumulate hits (not refs - refs have timing issues!)
    const gateHits: { gateId: string; position: { x: number; y: number; z: number }; damage: number }[] = [];
    const boulderHits: { enemyId: string; position: { x: number; y: number; z: number }; damage: number; destroy: boolean }[] = [];

    setBullets(prev => {
      if (prev.length === 0) return prev;

      // Debug logging - every ~2 seconds
      if (Math.random() < 0.03) {
        console.log(`=== BULLET UPDATE DEBUG ===`);
        console.log(`Bullets: ${prev.length}, Gates: ${currentGates.length}, Player Z: ${playerZ.toFixed(0)}`);

        // Show gates ahead of player
        const gatesAhead = currentGates.filter(g => g.position.z > playerZ && g.position.z < playerZ + 100);
        console.log(`Gates ahead (next 100 units): ${gatesAhead.length}`);
        gatesAhead.slice(0, 3).forEach(g => {
          const triggered = triggeredGateIds.current.has(g.id);
          console.log(`  Gate ${g.id}: z=${g.position.z.toFixed(0)}, x=${g.position.x.toFixed(1)}, triggered=${triggered}`);
        });

        // Show first few bullets
        prev.slice(0, 3).forEach((b, i) => {
          console.log(`  Bullet ${i}: z=${b.position.z.toFixed(0)}, x=${b.position.x.toFixed(1)}`);
        });
      }

      const updatedBullets: BulletData[] = [];

      for (const bullet of prev) {
        // Update position
        const newPos = {
          x: bullet.position.x + bullet.velocity.x * delta,
          y: bullet.position.y + bullet.velocity.y * delta,
          z: bullet.position.z + bullet.velocity.z * delta,
        };

        // Skip if expired
        if (now - bullet.createdAt > BULLET_LIFETIME) continue;

        // Skip if too far behind player
        if (newPos.z < playerZ - 20) continue;

        // Skip if way too far ahead
        if (newPos.z > playerZ + 200) continue;

        let bulletConsumed = false;

        // === GATE COLLISION - SIMPLIFIED AND CLEAR ===
        for (const gate of currentGates) {
          // Check Z distance (is bullet at same depth as gate?)
          const zDist = Math.abs(newPos.z - gate.position.z);
          if (zDist > 3.0) continue;

          // Check X bounds (is bullet within gate width?)
          const gateMinX = gate.position.x - GATE_WIDTH / 2 - 0.5;
          const gateMaxX = gate.position.x + GATE_WIDTH / 2 + 0.5;

          if (newPos.x >= gateMinX && newPos.x <= gateMaxX) {
            // HIT! Bullet collided with gate
            console.log(`🎯 BULLET HIT GATE! Gate: ${gate.id}, Bullet Z: ${newPos.z.toFixed(1)}, Gate Z: ${gate.position.z.toFixed(0)}`);

            gateHits.push({
              gateId: gate.id,
              position: { x: gate.position.x, y: 2, z: gate.position.z },
              damage: bullet.sourceIndex,
            });

            bulletConsumed = true;
            break;
          }
        }

        if (bulletConsumed) continue;

        // === BOULDER COLLISION ===
        for (const enemy of currentEnemies) {
          if (enemy.type !== 'boulder') continue;

          const dx = newPos.x - enemy.position.x;
          const dz = newPos.z - enemy.position.z;
          const dist = Math.sqrt(dx * dx + dz * dz);

          if (dist < (enemy as BoulderData).radius + 0.3) {
            const currentHealth = boulderHealthRef.current.get(enemy.id) ?? 10;
            const newHealth = currentHealth - 1;

            boulderHits.push({
              enemyId: enemy.id,
              position: { ...newPos },
              damage: bullet.sourceIndex,
              destroy: newHealth <= 0,
            });

            boulderHealthRef.current.set(enemy.id, newHealth);
            bulletConsumed = true;
            break;
          }
        }

        if (bulletConsumed) continue;

        // Bullet survived - update position and keep it
        updatedBullets.push({
          ...bullet,
          position: newPos,
        });
      }

      // ====== PROCESS HITS IMMEDIATELY INSIDE CALLBACK ======
      // This ensures hits are processed in the same execution context, avoiding closure issues

      // Process gate hits
      if (gateHits.length > 0) {
        console.log(`✨ PROCESSING ${gateHits.length} GATE HITS!`);

        // Update REF immediately for instant reads (no waiting for React state)
        gateHits.forEach(hit => {
          const currentValue = gateEnhancementsRef.current.get(hit.gateId) || 0;
          const newValue = currentValue + 1;
          gateEnhancementsRef.current.set(hit.gateId, newValue);
          console.log(`  🔥 Gate ${hit.gateId}: enhancement ${currentValue} -> ${newValue} (REF UPDATED IMMEDIATELY)`);
        });

        // Also update state for React re-renders (gate visuals)
        setGateEnhancements(prev => {
          const newMap = new Map(prev);
          gateHits.forEach(hit => {
            const currentValue = newMap.get(hit.gateId) || 0;
            const newValue = currentValue + 1;
            newMap.set(hit.gateId, newValue);
          });
          return newMap;
        });

        // Create floating damage numbers
        gateHits.forEach(hit => {
          createDamagePopup(hit.position, hit.damage);
        });
      }

      // Process boulder hits
      if (boulderHits.length > 0) {
        boulderHits.forEach(hit => {
          if (hit.destroy) {
            setEnemies(prevEnemies => prevEnemies.filter(e => e.id !== hit.enemyId));
            boulderHealthRef.current.delete(hit.enemyId);
            console.log(`💥 Boulder ${hit.enemyId} destroyed!`);
          }
          createDamagePopup(hit.position, hit.damage);
        });
      }

      return updatedBullets;
    });
  }, [player.position.z, createDamagePopup]);

  // Game loop - update time only (finish is handled in Player component)
  useEffect(() => {
    if (status !== 'playing' && status !== 'countdown') return;

    let lastTime = performance.now();
    let animationId: number;

    const gameLoop = () => {
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // Track game time for dead soldier animations
      gameTimeRef.current += delta;

      updateTime(delta);

      // Update bullets
      if (status === 'playing') {
        updateBullets(delta);
      }

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [status, updateTime, updateBullets]);

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

    // Get bullet enhancements for this gate - USE REF not state for instant read!
    const enhancement = gateEnhancementsRef.current.get(gateId) || 0;
    console.log(`🚪 Gate ${gateId} triggered with enhancement: ${enhancement}`);

    // Apply gate effect with enhancements
    switch (gateType) {
      case SimpleGateType.ADD_SOLDIERS:
        // Base +5, +1 per bullet hit
        addSoldiers(5 + enhancement);
        break;
      case SimpleGateType.SUBTRACT_SOLDIERS:
        // Base -3, +1 per bullet (becomes -2, -1, 0, +1, etc.)
        addSoldiers(-3 + enhancement);
        break;
      case SimpleGateType.MULTIPLY_SOLDIERS:
        // Base x2, +1 per bullet (becomes x3, x4, etc.)
        multiplyArmy(2 + enhancement);
        break;
      case SimpleGateType.DIVIDE_SOLDIERS:
        // Base ÷2, -1 per bullet (÷1 = no effect)
        const divisor = Math.max(1, 2 - enhancement);
        if (divisor > 1) divideArmy(divisor);
        break;
      case SimpleGateType.SPEED_BOOST:
        // Stronger boost per bullet (+10% per bullet)
        const boostMultiplier = SPEED_BOOST_MULTIPLIER + (enhancement * 0.1);
        setSpeedMultiplier(boostMultiplier, 'boost', SPEED_EFFECT_DURATION + (enhancement * 500));
        break;
      case SimpleGateType.SLOW_DOWN:
        // Convert toward speed boost with enough bullets
        if (enhancement >= 5) {
          // Converted to speed boost
          setSpeedMultiplier(1 + ((enhancement - 5) * 0.1), 'boost', SPEED_EFFECT_DURATION);
        } else {
          // Less slow
          const slowMultiplier = SPEED_SLOW_MULTIPLIER + (enhancement * 0.1);
          setSpeedMultiplier(slowMultiplier, 'slow', SPEED_EFFECT_DURATION);
        }
        break;
      case SimpleGateType.SHIELD:
        // Longer duration per bullet (+500ms per bullet)
        activateShield(SHIELD_DURATION + (enhancement * 500));
        break;
      case SimpleGateType.DOUBLE_POINTS:
        // Higher multiplier would need separate handling, just increase duration
        activateDoublePoints(DOUBLE_POINTS_DURATION + (enhancement * 1000));
        break;
      case SimpleGateType.MAGNET:
        // Longer duration per bullet
        activateMagnet(MAGNET_DURATION + (enhancement * 500));
        break;
      case SimpleGateType.GIANT:
        // Longer duration per bullet
        activateGiant(GIANT_DURATION + (enhancement * 500));
        break;
      // Additional negative gates
      case SimpleGateType.SUPER_SLOW:
        // Convert toward speed boost with enough bullets
        if (enhancement >= 8) {
          setSpeedMultiplier(1 + ((enhancement - 8) * 0.05), 'boost', SPEED_EFFECT_DURATION);
        } else {
          const superSlowMultiplier = SUPER_SLOW_MULTIPLIER + (enhancement * 0.1);
          setSpeedMultiplier(superSlowMultiplier, 'slow', SPEED_EFFECT_DURATION);
        }
        break;
      case SimpleGateType.SUBTRACT_SOLDIERS_5:
        addSoldiers(-5 + enhancement);
        break;
      case SimpleGateType.SUBTRACT_SOLDIERS_10:
        addSoldiers(-10 + enhancement);
        break;
      case SimpleGateType.DIVIDE_SOLDIERS_3:
        const divisor3 = Math.max(1, 3 - enhancement);
        if (divisor3 > 1) divideArmy(divisor3);
        break;
      case SimpleGateType.REVERSE_CONTROLS:
        // Reduce duration with bullets, or skip entirely
        const reverseDuration = Math.max(0, REVERSE_CONTROLS_DURATION - (enhancement * 500));
        if (reverseDuration > 0) {
          activateReverseControls(reverseDuration);
        }
        break;
      case SimpleGateType.SHRINK:
        // Reduce duration with bullets
        const shrinkDuration = Math.max(0, SHRINK_DURATION - (enhancement * 500));
        if (shrinkDuration > 0) {
          activateShrink(shrinkDuration);
        }
        break;
      case SimpleGateType.WEAPON_POWER:
        // Temporary weapon power boost
        // Base boost + 1 per bullet enhancement
        const weaponBoost = WEAPON_POWER_BASE_BOOST + enhancement;
        setTemporaryWeaponBoost(prev => Math.min(9, prev + weaponBoost));
        // Schedule boost removal after duration (+ 500ms per bullet)
        setTimeout(() => {
          setTemporaryWeaponBoost(0);
        }, WEAPON_POWER_DURATION + (enhancement * 500));
        break;
    }

    // Clear enhancement after use (both ref and state)
    gateEnhancementsRef.current.delete(gateId);
    setGateEnhancements(prev => {
      const newMap = new Map(prev);
      newMap.delete(gateId);
      return newMap;
    });

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

  // Handle bullet fired by soldier
  const handleBulletFire = useCallback((bullet: BulletData) => {
    setBullets(prev => {
      // Limit max bullets for performance
      if (prev.length >= MAX_ACTIVE_BULLETS) {
        // Remove oldest bullets to make room
        const newBullets = prev.slice(-MAX_ACTIVE_BULLETS + 1);
        return [...newBullets, bullet];
      }
      return [...prev, bullet];
    });
  }, []);

  // Helper to create a dead soldier with ragdoll physics
  const createDeadSoldier = useCallback((
    position: { x: number; z: number },
    enemyPosition: { x: number; z: number },
    enemyRotation: number
  ): DeadSoldierData => {
    // Calculate push direction from enemy to soldier
    const dx = position.x - enemyPosition.x;
    const dz = position.z - enemyPosition.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const dirX = dist > 0 ? dx / dist : Math.cos(enemyRotation);
    const dirZ = dist > 0 ? dz / dist : Math.sin(enemyRotation);

    // Add tangential velocity from spinner rotation
    const tangentX = -dirZ;
    const tangentZ = dirX;

    // Random push strengths for variety
    const pushStrength = 8 + Math.random() * 4;
    const tangentStrength = 3 + Math.random() * 2;
    const upwardStrength = 5 + Math.random() * 3;

    // Use pool to acquire dead soldier object
    return deadSoldierPoolRef.current.acquire({
      id: `dead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: { x: position.x, y: GROUND_Y + 0.1, z: position.z },
      velocity: {
        x: dirX * pushStrength + tangentX * tangentStrength,
        y: upwardStrength,
        z: dirZ * pushStrength + tangentZ * tangentStrength,
      },
      rotation: { x: 0, y: Math.atan2(dirX, dirZ), z: 0 },
      rotationSpeed: {
        x: (Math.random() - 0.5) * 8,
        y: 0,
        z: (Math.random() - 0.5) * 6,
      },
      timeOfDeath: gameTimeRef.current,
      skinId: currentSkin,
    });
  }, [currentSkin]);

  // Handle player being killed by enemy
  const handlePlayerKill = useCallback((
    playerPos: { x: number; z: number },
    enemyPos: { x: number; z: number },
    enemyRotation: number
  ) => {
    // Create dead soldier ragdoll at player position
    const deadSoldier = createDeadSoldier(playerPos, enemyPos, enemyRotation);
    setDeadSoldiers(prev => [...prev, deadSoldier]);

    killPlayer();

    // Strong haptic feedback for player death
    if (isVibrationEnabled) {
      vibrate(100);
    }
  }, [killPlayer, isVibrationEnabled, createDeadSoldier]);

  // Handle multiple soldiers being killed by enemy (batch processing)
  const handleSoldiersKill = useCallback((deaths: DeathInfo[]) => {
    // Create dead soldier ragdolls for each death
    const newDeadSoldiers = deaths.map(death =>
      createDeadSoldier(death.position, death.enemyPosition, death.enemyRotation)
    );

    setDeadSoldiers(prev => [...prev, ...newDeadSoldiers]);

    // Remove all soldiers from army at once (batch)
    damageArmy(deaths.length);

    // Medium haptic feedback for soldier deaths (stronger for multiple)
    if (isVibrationEnabled) {
      vibrate(50 * Math.min(deaths.length, 3));
    }
  }, [damageArmy, isVibrationEnabled, createDeadSoldier]);

  // Remove dead soldier after animation completes
  const handleRemoveDeadSoldier = useCallback((id: string) => {
    setDeadSoldiers(prev => {
      const removed = prev.find(s => s.id === id);
      if (removed) {
        deadSoldierPoolRef.current.release(removed);
      }
      return prev.filter(s => s.id !== id);
    });
  }, []);

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

  // Extract boulder collision data from enemies
  const boulderCollisions: BoulderCollision[] = useMemo(() => {
    return enemies
      .filter((e): e is BoulderData => e.type === 'boulder')
      .map((boulder) => ({
        x: boulder.position.x,
        z: boulder.position.z,
        radius: boulder.radius + 0.5, // Add padding for collision
      }));
  }, [enemies]);

  // Show loading screen during loading phase
  if (loadingPhase === 'loading') {
    return (
      <div className="w-full h-full touch-none relative">
        <GameLoader
          onLoadComplete={handleLoadComplete}
          trackLength={TRACK_LENGTH}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full touch-none relative">
      {/* Restart overlay - covers everything for 3 seconds during restart */}
      {showRestartOverlay && (
        <div className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center">
          <div className="text-6xl mb-4 animate-bounce">🎮</div>
          <div className="text-white text-2xl font-bold mb-4">Loading Game...</div>
          <div className="w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-400 animate-pulse" style={{ width: '100%' }} />
          </div>
        </div>
      )}

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
        {/* Camera - use EndGameCamera during endgame, otherwise GameCamera */}
        {status === 'endgame' ? (
          <EndGameCamera enabled={true} />
        ) : (
          <GameCamera target={player.position} />
        )}

        {/* Environment - sky, ground, lighting */}
        <Environment />

        {/* Track with random textures and finish line */}
        <Track />

        {/* Finish Gate - large decorative gate at end of track */}
        <FinishGate />

        {/* Stairs - visible at end of track (after finish gate) */}
        <Stairs showSoldiers={status === 'endgame'} />

        {/* Coins on track */}
        <CoinsRenderer coins={coins} onCoinCollect={handleCoinCollect} armySize={armySize} />

        {/* Gates on track */}
        <GatesRenderer gates={gates} onGateTrigger={handleGateTrigger} armySize={armySize} gateEnhancements={gateEnhancements} />

        {/* Enemies on track (spinning spike obstacles) */}
        <EnemiesRenderer
          enemies={enemies}
          onPlayerKill={handlePlayerKill}
          onSoldiersKill={handleSoldiersKill}
          armySize={armySize}
        />

        {/* Dead soldiers with ragdoll physics */}
        <DeadSoldiersRenderer
          deadSoldiers={deadSoldiers}
          onRemove={handleRemoveDeadSoldier}
          currentTime={gameTimeRef.current}
        />

        {/* Bullets - using simple rendering for debugging */}
        <BulletSystem bullets={bullets} />

        {/* Floating damage numbers */}
        <DamagePopups popups={damagePopups} />

        {/* Soldier pickups on track */}
        <SoldierPickups
          soldiers={soldiers}
          onCollect={handleSoldierCollect}
        />

        {/* Army following player (tiered system - max 10 soldiers with levels) */}
        {status !== 'endgame' && (
          <TieredArmyFollowers
            armySize={armySize}
            boulders={boulderCollisions}
            weaponTier={effectiveWeaponTier}
            onBulletFire={handleBulletFire}
            playerSpeed={playerSpeed}
          />
        )}

        {/* Player with smooth movement - hide during endgame */}
        {status !== 'endgame' && (
          <Player boulders={boulderCollisions} />
        )}

        {/* Stair Climb Controller - handles player climbing during endgame */}
        {status === 'endgame' && (
          <StairClimbController />
        )}

        {/* Confetti effect during endgame */}
        {status === 'endgame' && (
          <Confetti enabled={true} />
        )}
      </Canvas>
    </div>
  );
}
