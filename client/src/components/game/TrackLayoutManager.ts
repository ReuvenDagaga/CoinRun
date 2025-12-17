/**
 * TrackLayoutManager.ts
 *
 * Smart placement system that generates all track objects together
 * while preventing overlapping and ensuring proper spacing.
 */

import type { GateData, EnemyData, SpinnerData, FistData, BoulderData } from './Track/Environment/types';
import type { CoinData } from './coin/coinTypes';
import type { SoldierPickupData } from './SoldierPickup';
import {
  SimpleGateType,
  SPINNER_KILL_RADIUS,
  SPINNER_ROTATION_SPEED_MIN,
  SPINNER_ROTATION_SPEED_MAX,
  FIST_CYCLE_DURATION,
  BOULDER_RADIUS_MIN,
  BOULDER_RADIUS_MAX,
} from './Track/Environment/types';
import { COIN_FLOAT_HEIGHT } from './coin/coinTypes';
import { GROUND_Y } from './Player';

// =====================
// Configuration
// =====================

// Track dimensions
const TRACK_HALF_WIDTH = 5;

// Minimum spacing rules (in meters)
const MIN_SPACING = {
  // Same type spacing
  gate_gate: 80,
  spinner_spinner: 60,
  fist_fist: 80,
  boulder_boulder: 40,
  coin_coin: 2,
  soldier_soldier: 30,

  // Cross-type spacing (min distance from any object)
  gate_any: 15,
  spinner_any: 12,
  fist_any: 12,
  boulder_any: 8,
  coin_any: 2,
  soldier_any: 5,
};

// Object radii for collision detection
const OBJECT_RADIUS = {
  gate: 3.0,      // Gate is wide
  spinner: 2.5,   // Spinner spike radius
  fist: 2.0,      // Fist danger area
  boulder: 1.5,   // Boulder radius
  coin: 0.8,      // Coin collection radius
  soldier: 1.0,   // Soldier pickup radius
};

// Generation parameters
const GATE_START_Z = 100;
const GATE_SPACING = 100;
const SPINNER_START_Z = 150;
const FIST_START_Z = 200;
const BOULDER_START_Z = 100;
const COIN_GROUP_START_Z = 50;
const SOLDIER_START_Z = 50;

// =====================
// Types
// =====================

interface PlacedObject {
  type: 'gate' | 'spinner' | 'fist' | 'boulder' | 'coin' | 'soldier';
  x: number;
  z: number;
  radius: number;
}

interface TrackLayout {
  gates: GateData[];
  enemies: EnemyData[];
  coins: CoinData[];
  soldiers: SoldierPickupData[];
}

// =====================
// Placement Manager
// =====================

class PlacementManager {
  private placedObjects: PlacedObject[] = [];
  private trackLength: number;

  constructor(trackLength: number) {
    this.trackLength = trackLength;
  }

  /**
   * Check if a position is valid (no collision with existing objects)
   */
  canPlace(
    type: PlacedObject['type'],
    x: number,
    z: number,
    radius: number
  ): boolean {
    const minSameType = this.getMinSameTypeSpacing(type);
    const minAny = this.getMinAnySpacing(type);

    for (const obj of this.placedObjects) {
      const dx = x - obj.x;
      const dz = z - obj.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      const minDistance = radius + obj.radius;

      // Check same type spacing
      if (obj.type === type && distance < minSameType) {
        return false;
      }

      // Check any object spacing
      if (distance < Math.max(minAny, minDistance)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Try to place an object, searching for valid position if needed
   */
  tryPlace(
    type: PlacedObject['type'],
    preferredX: number,
    preferredZ: number,
    radius: number,
    maxSearchRadius: number = 5
  ): { x: number; z: number } | null {
    // Try preferred position first
    if (this.canPlace(type, preferredX, preferredZ, radius)) {
      this.placedObjects.push({ type, x: preferredX, z: preferredZ, radius });
      return { x: preferredX, z: preferredZ };
    }

    // Search in expanding circles
    for (let searchDist = 1; searchDist <= maxSearchRadius; searchDist++) {
      const attempts = 8 * searchDist; // More attempts at larger radii
      for (let i = 0; i < attempts; i++) {
        const angle = (i / attempts) * Math.PI * 2;
        const testX = preferredX + Math.cos(angle) * searchDist;
        const testZ = preferredZ + Math.sin(angle) * searchDist;

        // Keep within track bounds
        const clampedX = Math.max(-TRACK_HALF_WIDTH + radius, Math.min(TRACK_HALF_WIDTH - radius, testX));

        if (this.canPlace(type, clampedX, testZ, radius)) {
          this.placedObjects.push({ type, x: clampedX, z: testZ, radius });
          return { x: clampedX, z: testZ };
        }
      }
    }

    return null; // Could not find valid position
  }

  /**
   * Force place an object (for high priority items)
   */
  forcPlace(type: PlacedObject['type'], x: number, z: number, radius: number): void {
    this.placedObjects.push({ type, x, z, radius });
  }

  private getMinSameTypeSpacing(type: PlacedObject['type']): number {
    switch (type) {
      case 'gate': return MIN_SPACING.gate_gate;
      case 'spinner': return MIN_SPACING.spinner_spinner;
      case 'fist': return MIN_SPACING.fist_fist;
      case 'boulder': return MIN_SPACING.boulder_boulder;
      case 'coin': return MIN_SPACING.coin_coin;
      case 'soldier': return MIN_SPACING.soldier_soldier;
      default: return 10;
    }
  }

  private getMinAnySpacing(type: PlacedObject['type']): number {
    switch (type) {
      case 'gate': return MIN_SPACING.gate_any;
      case 'spinner': return MIN_SPACING.spinner_any;
      case 'fist': return MIN_SPACING.fist_any;
      case 'boulder': return MIN_SPACING.boulder_any;
      case 'coin': return MIN_SPACING.coin_any;
      case 'soldier': return MIN_SPACING.soldier_any;
      default: return 5;
    }
  }
}

// =====================
// Gate Generation
// =====================

function generateGatesWithManager(
  manager: PlacementManager,
  trackLength: number
): GateData[] {
  const gates: GateData[] = [];
  const gateTypes = [
    SimpleGateType.ADD_SOLDIERS,
    SimpleGateType.SUBTRACT_SOLDIERS,
    SimpleGateType.MULTIPLY_SOLDIERS,
    SimpleGateType.DIVIDE_SOLDIERS,
    SimpleGateType.SPEED_BOOST,
    SimpleGateType.SLOW_DOWN,
    SimpleGateType.SHIELD,
    SimpleGateType.DOUBLE_POINTS,
    SimpleGateType.MAGNET,
    SimpleGateType.GIANT,
    SimpleGateType.SUPER_SLOW,
    SimpleGateType.SUBTRACT_SOLDIERS_5,
    SimpleGateType.SUBTRACT_SOLDIERS_10,
    SimpleGateType.DIVIDE_SOLDIERS_3,
    SimpleGateType.REVERSE_CONTROLS,
    SimpleGateType.SHRINK,
  ];

  let z = GATE_START_Z;
  let gateIndex = 0;

  while (z < trackLength - 60) {
    const randomType = gateTypes[Math.floor(Math.random() * gateTypes.length)];
    const isLeftSide = Math.random() < 0.5;
    const preferredX = isLeftSide ? -2.5 : 2.5;

    // Gates are high priority - force place them
    manager.forcPlace('gate', preferredX, z, OBJECT_RADIUS.gate);

    gates.push({
      id: `gate-${gateIndex}`,
      type: randomType,
      position: { x: preferredX, y: 0, z },
      isTriggered: false,
      side: isLeftSide ? 'left' : 'right',
    });

    z += GATE_SPACING;
    gateIndex++;
  }

  return gates;
}

// =====================
// Enemy Generation
// =====================

function generateEnemiesWithManager(
  manager: PlacementManager,
  trackLength: number
): EnemyData[] {
  const enemies: EnemyData[] = [];
  let enemyIndex = 0;

  // Generate spinners
  let z = SPINNER_START_Z;
  while (z < trackLength - 50) {
    const preferredX = (Math.random() - 0.5) * 8;
    const pos = manager.tryPlace('spinner', preferredX, z, OBJECT_RADIUS.spinner, 8);

    if (pos) {
      const rotationSpeed = SPINNER_ROTATION_SPEED_MIN +
        Math.random() * (SPINNER_ROTATION_SPEED_MAX - SPINNER_ROTATION_SPEED_MIN);

      enemies.push({
        id: `spinner-${enemyIndex}`,
        type: 'spinner',
        position: { x: pos.x, y: 0, z: pos.z },
        rotationSpeed,
        spikeRadius: SPINNER_KILL_RADIUS,
      } as SpinnerData);

      enemyIndex++;
    }

    // Dynamic spacing based on progress
    const progressRatio = z / trackLength;
    const spacingMultiplier = 1 - (progressRatio * 0.3);
    const spacing = 60 + Math.random() * 40 * spacingMultiplier;
    z += spacing;
  }

  // Generate fists
  z = FIST_START_Z;
  while (z < trackLength - 50) {
    const side: 'left' | 'right' = Math.random() < 0.5 ? 'left' : 'right';
    const xPosition = side === 'left' ? -5 : 5;

    // Fists are placed at track edge - just check Z spacing
    const pos = manager.tryPlace('fist', xPosition, z, OBJECT_RADIUS.fist, 3);

    if (pos) {
      enemies.push({
        id: `fist-${enemyIndex}`,
        type: 'fist',
        position: { x: pos.x, y: 0, z: pos.z },
        side,
        punchCycleDuration: FIST_CYCLE_DURATION,
      } as FistData);

      enemyIndex++;
    }

    const spacing = 80 + Math.random() * 40;
    z += spacing;
  }

  // Generate boulders
  z = BOULDER_START_Z;
  while (z < trackLength - 50) {
    const preferredX = (Math.random() - 0.5) * 6;
    const radius = BOULDER_RADIUS_MIN + Math.random() * (BOULDER_RADIUS_MAX - BOULDER_RADIUS_MIN);
    const pos = manager.tryPlace('boulder', preferredX, z, radius + 0.5, 6);

    if (pos) {
      enemies.push({
        id: `boulder-${enemyIndex}`,
        type: 'boulder',
        position: { x: pos.x, y: 0, z: pos.z },
        radius,
        rotationY: Math.random() * Math.PI * 2,
      } as BoulderData);

      enemyIndex++;
    }

    const spacing = 40 + Math.random() * 30;
    z += spacing;
  }

  return enemies;
}

// =====================
// Coin Generation
// =====================

type CoinPattern = 'horizontal' | 'vertical' | 'arc' | 'zigzag';

function generateCoinsWithManager(
  manager: PlacementManager,
  trackLength: number
): CoinData[] {
  const coins: CoinData[] = [];
  let currentZ = COIN_GROUP_START_Z;
  let groupIndex = 0;

  const MIN_COINS_PER_GROUP = 5;
  const MAX_COINS_PER_GROUP = 8;
  const MIN_GROUP_SPACING = 40;
  const MAX_GROUP_SPACING = 60;
  const COIN_SPACING = 2.0;

  while (currentZ < trackLength - 50) {
    const patternRoll = Math.random();
    let pattern: CoinPattern;

    if (patternRoll < 0.35) {
      pattern = 'horizontal';
    } else if (patternRoll < 0.65) {
      pattern = 'vertical';
    } else if (patternRoll < 0.85) {
      pattern = 'arc';
    } else {
      pattern = 'zigzag';
    }

    const groupSize = MIN_COINS_PER_GROUP + Math.floor(Math.random() * (MAX_COINS_PER_GROUP - MIN_COINS_PER_GROUP + 1));

    // Try to find a clear area for the coin group
    let centerX = (Math.random() - 0.5) * 6;
    let foundSpot = false;

    // Try multiple positions for the group center
    for (let attempt = 0; attempt < 5; attempt++) {
      const testX = (Math.random() - 0.5) * 6;
      if (manager.canPlace('coin', testX, currentZ, 3)) {
        centerX = testX;
        foundSpot = true;
        break;
      }
    }

    if (foundSpot) {
      const patternId = `group-${groupIndex}`;
      const groupCoins = generateCoinPatternSafe(
        manager,
        pattern,
        groupSize,
        centerX,
        currentZ,
        patternId,
        COIN_SPACING
      );
      coins.push(...groupCoins);
      groupIndex++;
    }

    const spacing = MIN_GROUP_SPACING + Math.random() * (MAX_GROUP_SPACING - MIN_GROUP_SPACING);
    currentZ += spacing;
  }

  return coins;
}

function generateCoinPatternSafe(
  manager: PlacementManager,
  pattern: CoinPattern,
  count: number,
  centerX: number,
  centerZ: number,
  patternId: string,
  coinSpacing: number
): CoinData[] {
  const coins: CoinData[] = [];
  const positions: Array<{ x: number; z: number }> = [];

  // Generate potential positions based on pattern
  switch (pattern) {
    case 'horizontal': {
      const startX = centerX - ((count - 1) * coinSpacing) / 2;
      for (let i = 0; i < count; i++) {
        positions.push({ x: startX + i * coinSpacing, z: centerZ });
      }
      break;
    }
    case 'vertical': {
      for (let i = 0; i < count; i++) {
        positions.push({ x: centerX, z: centerZ + i * coinSpacing });
      }
      break;
    }
    case 'arc': {
      const arcRadius = 3;
      const arcAngle = Math.PI * 0.5;
      const startAngle = -arcAngle / 2;
      for (let i = 0; i < count; i++) {
        const angle = startAngle + (arcAngle * i) / (count - 1);
        positions.push({
          x: centerX + Math.sin(angle) * arcRadius,
          z: centerZ + (1 - Math.cos(angle)) * arcRadius,
        });
      }
      break;
    }
    case 'zigzag': {
      const zigWidth = 1.5;
      for (let i = 0; i < count; i++) {
        const zigOffset = (i % 2 === 0 ? -1 : 1) * zigWidth;
        positions.push({
          x: centerX + zigOffset,
          z: centerZ + i * coinSpacing * 0.7,
        });
      }
      break;
    }
  }

  // Place coins, skipping if position conflicts
  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i];
    const clampedX = Math.max(-TRACK_HALF_WIDTH, Math.min(TRACK_HALF_WIDTH, pos.x));

    // Try to place, but don't search - just skip if blocked
    if (manager.canPlace('coin', clampedX, pos.z, OBJECT_RADIUS.coin)) {
      manager.forcPlace('coin', clampedX, pos.z, OBJECT_RADIUS.coin);
      coins.push({
        id: `coin-${patternId}-${i}`,
        position: { x: clampedX, y: COIN_FLOAT_HEIGHT, z: pos.z },
        isCollected: false,
        patternId,
      });
    }
  }

  return coins;
}

// =====================
// Soldier Generation
// =====================

function generateSoldiersWithManager(
  manager: PlacementManager,
  trackLength: number
): SoldierPickupData[] {
  const soldiers: SoldierPickupData[] = [];
  const SOLDIER_SPACING = 60; // Every 60m

  for (let z = SOLDIER_START_Z; z < trackLength - 50; z += SOLDIER_SPACING) {
    const preferredX = (Math.random() - 0.5) * 8;
    const preferredZ = z + (Math.random() - 0.5) * 20;

    const pos = manager.tryPlace('soldier', preferredX, preferredZ, OBJECT_RADIUS.soldier, 6);

    if (pos) {
      soldiers.push({
        id: `soldier-${soldiers.length}`,
        position: {
          x: pos.x,
          y: GROUND_Y,
          z: pos.z,
        },
        isCollected: false,
      });
    }
  }

  return soldiers;
}

// =====================
// Main Export Function
// =====================

/**
 * Generate all track objects with smart placement to prevent overlapping.
 * Objects are placed in priority order: Gates > Enemies > Soldiers > Coins
 */
export function generateTrackLayout(trackLength: number = 2000): TrackLayout {
  const manager = new PlacementManager(trackLength);

  // Priority 1: Gates (gameplay critical)
  const gates = generateGatesWithManager(manager, trackLength);

  // Priority 2: Enemies (obstacles)
  const enemies = generateEnemiesWithManager(manager, trackLength);

  // Priority 3: Soldiers (collectibles)
  const soldiers = generateSoldiersWithManager(manager, trackLength);

  // Priority 4: Coins (fill remaining spaces)
  const coins = generateCoinsWithManager(manager, trackLength);

  return { gates, enemies, coins, soldiers };
}

export default generateTrackLayout;
