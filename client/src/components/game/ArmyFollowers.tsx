import { useRef, memo, useState, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/context';
import { useAuth } from '@/hooks/useAuth';
import { CharacterModel, CharacterModelRef } from './characters';
import { GROUND_Y, getAnimationFromSpeed } from './Player';
import { STAIR_CONSTANTS, GAME_CONSTANTS } from '@shared/types/game.types';
import { TRACK_LENGTH } from './Track/config';
import { WeaponModel } from './weapons/WeaponModel';
import { WeaponTier, WEAPON_CONFIGS, getWeaponTier, BulletData, BULLET_Y_OFFSET } from './weapons/types';

// Calculate stairs start position based on actual track length
const STAIRS_START_Z = TRACK_LENGTH + 10;

// Maximum soldiers to add per frame to prevent freeze
const MAX_SOLDIERS_PER_FRAME = 5;

function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

// New tighter, organic formation constants
const SOLDIERS_PER_ROW = 3;
const SPACING_X = 0.8; // Reduced from 1.2 - much tighter
const SPACING_Z = 1.0; // Reduced from 1.5 - closer together
const BACK_OFFSET = -1.5; // Closer to player

// Seeded random for consistent randomization per soldier
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// Boulder collision data
interface BoulderCollision {
  x: number;
  z: number;
  radius: number;
}

function getFormationPosition(
  index: number,
  playerX: number,
  playerZ: number
): { x: number; y: number; z: number } {
  const row = Math.floor(index / SOLDIERS_PER_ROW);
  const col = index % SOLDIERS_PER_ROW;

  // Calculate soldiers in this row for dynamic width adjustment
  const soldiersInRow = SOLDIERS_PER_ROW;

  // Base position in tighter grid
  const baseXOffset = (col - (soldiersInRow - 1) / 2) * SPACING_X;
  const baseZOffset = BACK_OFFSET - row * SPACING_Z;

  // Add seeded random offsets for organic feel
  // Use different prime multipliers for X and Z to avoid correlation
  const seedX = index * 7 + 13;
  const seedZ = index * 11 + 17;
  const randomXOffset = (seededRandom(seedX) - 0.5) * 0.6; // ±0.3 units
  const randomZOffset = (seededRandom(seedZ) - 0.5) * 0.4; // ±0.2 units

  // Soldiers closer to front are more centered, back rows spread wider
  const rowSpreadMultiplier = 1 + row * 0.1; // Spread increases by 10% per row
  const adjustedXOffset = baseXOffset * rowSpreadMultiplier;

  return {
    x: playerX + adjustedXOffset + randomXOffset,
    y: GROUND_Y,
    z: playerZ + baseZOffset + randomZOffset,
  };
}

// Apply boulder collision avoidance to a position
function applyBoulderCollision(
  posX: number,
  posZ: number,
  boulders: BoulderCollision[],
  soldierRadius: number = 0.3
): { x: number; z: number } {
  let resultX = posX;
  let resultZ = posZ;

  for (const boulder of boulders) {
    const dx = resultX - boulder.x;
    const dz = resultZ - boulder.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    const minDistance = boulder.radius + soldierRadius;

    if (distance < minDistance && distance > 0.01) {
      // Push soldier out of boulder
      const pushFactor = (minDistance - distance) / distance;
      resultX += dx * pushFactor * 1.2; // 1.2 for extra push
      resultZ += dz * pushFactor * 1.2;
    }
  }

  return { x: resultX, z: resultZ };
}

// Calculate which stair a soldier goes to based on index
function getSoldierStairAssignment(soldierIndex: number): { stair: number; positionOnStair: number } | null {
  let cumulativeCost = 0;
  for (let stair = 0; stair < STAIR_CONSTANTS.TOTAL_STAIRS; stair++) {
    const stairCost = STAIR_CONSTANTS.STAIR_COSTS[stair];
    if (soldierIndex < cumulativeCost + stairCost) {
      return { stair, positionOnStair: soldierIndex - cumulativeCost };
    }
    cumulativeCost += stairCost;
  }
  return null;
}

// Calculate position on a stair for a soldier
function getStairPosition(stair: number, positionOnStair: number, totalOnStair: number): { x: number; y: number; z: number } {
  // Use local STAIRS_START_Z which is based on actual TRACK_LENGTH
  const stairZ = STAIRS_START_Z + stair * (STAIR_CONSTANTS.STAIR_DEPTH + STAIR_CONSTANTS.STAIR_GAP);
  const stairY = stair * STAIR_CONSTANTS.STAIR_HEIGHT + STAIR_CONSTANTS.STAIR_HEIGHT / 2;

  // Spread soldiers across the stair width
  const spacing = Math.min(STAIR_CONSTANTS.STAIR_WIDTH / (totalOnStair + 1), 1.5);
  const startX = -(totalOnStair - 1) * spacing / 2;
  const x = startX + positionOnStair * spacing;

  return {
    x,
    y: stairY + 0.3,
    z: stairZ + STAIR_CONSTANTS.STAIR_DEPTH / 2
  };
}

interface ArmySoldierProps {
  index: number;
  playerX: number;
  playerZ: number;
  skinId: string;
  speedMultiplier: number;
  boulders: BoulderCollision[];
  isEndGame: boolean;
  currentClimbedStair: number;
  soldiersRemaining: number;
  weaponTier: WeaponTier;
  onFire?: (soldierIndex: number, position: { x: number; y: number; z: number }) => void;
}

const ArmySoldier = memo(function ArmySoldier({
  index,
  playerX,
  playerZ,
  skinId,
  speedMultiplier,
  boulders,
  isEndGame,
  currentClimbedStair,
  soldiersRemaining,
  weaponTier,
  onFire,
}: ArmySoldierProps) {
  const groupRef = useRef<THREE.Group>(null);
  const characterRef = useRef<CharacterModelRef>(null);
  const lastAnimState = useRef(getAnimationFromSpeed(speedMultiplier));
  const lastFireTime = useRef(0);

  // Each soldier has a unique animation phase offset and wobble frequency
  const animPhaseOffset = seededRandom(index * 23 + 7) * Math.PI * 2;
  const wobbleFrequency = 1.5 + seededRandom(index * 31 + 11) * 1.0; // 1.5-2.5 Hz
  const wobbleAmplitude = 0.02 + seededRandom(index * 37 + 13) * 0.02; // 0.02-0.04 units

  // Stagger fire times so not all soldiers fire at once
  const fireTimeOffset = seededRandom(index * 41 + 19) * 1000; // 0-1 second offset

  const currentPos = useRef({
    x: playerX,
    y: GROUND_Y,
    z: playerZ + BACK_OFFSET - Math.floor(index / SOLDIERS_PER_ROW) * SPACING_Z,
  });

  // Track if this soldier has been "consumed" by a stair
  const stairAssignment = getSoldierStairAssignment(index);
  const isConsumedByStair = stairAssignment && stairAssignment.stair < currentClimbedStair;
  const isOnCurrentStair = stairAssignment && stairAssignment.stair === currentClimbedStair;

  useFrame((state) => {
    if (!groupRef.current) return;

    let targetX: number;
    let targetY: number;
    let targetZ: number;
    let smoothFactor = 0.15;

    if (isEndGame && isConsumedByStair && stairAssignment) {
      // Soldier has been consumed - move to stair position
      const stairCost = STAIR_CONSTANTS.STAIR_COSTS[stairAssignment.stair];
      const stairPos = getStairPosition(stairAssignment.stair, stairAssignment.positionOnStair, stairCost);
      targetX = stairPos.x;
      targetY = stairPos.y;
      targetZ = stairPos.z;
      smoothFactor = 0.08; // Slower transition for stair movement

      // Set to idle when on stair
      if (lastAnimState.current !== 'idle') {
        characterRef.current?.setAnimation('idle');
        lastAnimState.current = 'idle';
      }
    } else if (isEndGame) {
      // Still following during endgame but before being consumed
      const target = getFormationPosition(index, playerX, playerZ);
      targetX = target.x;
      targetY = GROUND_Y;
      targetZ = target.z;

      // Apply boulder collision
      if (boulders.length > 0) {
        const collisionResult = applyBoulderCollision(targetX, targetZ, boulders);
        targetX = collisionResult.x;
        targetZ = collisionResult.z;
      }
    } else {
      // Normal following during gameplay
      const target = getFormationPosition(index, playerX, playerZ);
      targetX = target.x;
      targetY = GROUND_Y;
      targetZ = target.z;

      // Apply boulder collision
      if (boulders.length > 0) {
        const collisionResult = applyBoulderCollision(targetX, targetZ, boulders);
        targetX = collisionResult.x;
        targetZ = collisionResult.z;
      }

      // Add subtle side-to-side wobble unique to each soldier
      const time = state.clock.elapsedTime;
      const wobble = Math.sin(time * wobbleFrequency * Math.PI * 2 + animPhaseOffset) * wobbleAmplitude;
      targetX += wobble;

      const animState = getAnimationFromSpeed(speedMultiplier);
      if (animState !== lastAnimState.current) {
        characterRef.current?.setAnimation(animState);
        lastAnimState.current = animState;
      }
    }

    // Smoothly interpolate position
    currentPos.current.x = lerp(currentPos.current.x, targetX, smoothFactor);
    currentPos.current.y = lerp(currentPos.current.y, targetY, smoothFactor);
    currentPos.current.z = lerp(currentPos.current.z, targetZ, smoothFactor);

    groupRef.current.position.set(
      currentPos.current.x,
      currentPos.current.y,
      currentPos.current.z
    );

    // Shooting logic - only during gameplay, not endgame or on stairs
    if (!isEndGame && !isConsumedByStair && onFire) {
      const now = Date.now();
      const config = WEAPON_CONFIGS[weaponTier];
      const fireInterval = 1000 / config.fireRate; // Convert rate to interval in ms

      // Check if enough time has passed (with staggered offset)
      if (now - lastFireTime.current >= fireInterval + fireTimeOffset) {
        onFire(index, {
          x: currentPos.current.x,
          y: currentPos.current.y,
          z: currentPos.current.z,
        });
        lastFireTime.current = now - fireTimeOffset; // Reset timer (subtract offset so next fire is at proper interval)
      }
    }
  });

  return (
    <group ref={groupRef} position={[currentPos.current.x, currentPos.current.y, currentPos.current.z]}>
      <CharacterModel
        ref={characterRef}
        skinId={skinId}
        animation={isConsumedByStair ? 'idle' : getAnimationFromSpeed(speedMultiplier)}
        scale={1}
      />
      {/* Weapon attached to right hand position */}
      <group position={[0.25, 0.5, 0.15]} rotation={[0, 0, -0.3]}>
        <WeaponModel tier={weaponTier} />
      </group>
    </group>
  );
});

interface ArmyFollowersProps {
  armySize: number;
  boulders?: BoulderCollision[];
  weaponTier?: WeaponTier;
  onBulletFire?: (bullet: BulletData) => void;
  playerSpeed?: number;
}

export const ArmyFollowers = memo(function ArmyFollowers({
  armySize,
  boulders = [],
  weaponTier = 1,
  onBulletFire,
  playerSpeed = GAME_CONSTANTS.BASE_SPEED,
}: ArmyFollowersProps) {
  const { player, status, speedMultiplier, endGameState } = useGame();
  const { user } = useAuth();
  const bulletIdCounter = useRef(0);

  // Gradually animate to target army size to prevent frame freeze
  const [displayedArmySize, setDisplayedArmySize] = useState(0);
  const targetArmySizeRef = useRef(armySize);

  // Update target when armySize prop changes
  useEffect(() => {
    targetArmySizeRef.current = armySize;
  }, [armySize]);

  // Gradually adjust displayed army size in useFrame to spread load across frames
  useFrame(() => {
    const target = targetArmySizeRef.current;
    const current = displayedArmySize;

    if (current < target) {
      // Adding soldiers - add up to MAX_SOLDIERS_PER_FRAME per frame
      const toAdd = Math.min(MAX_SOLDIERS_PER_FRAME, target - current);
      setDisplayedArmySize(current + toAdd);
    } else if (current > target) {
      // Removing soldiers - can happen instantly (no new components to create)
      setDisplayedArmySize(target);
    }
  });

  // Filter boulders near player for collision detection
  const nearbyBoulders = boulders.filter(
    (b) => Math.abs(b.z - player.position.z) < 20
  );

  const currentSkin = user?.currentSkin || user?.ownedSkins?.[0] || 'default';
  const isEndGame = status === 'endgame';
  const currentClimbedStair = endGameState?.currentStair || 0;
  const soldiersRemaining = endGameState?.soldiersRemaining || armySize;

  // Handle bullet firing from soldiers
  const handleSoldierFire = useCallback(
    (soldierIndex: number, position: { x: number; y: number; z: number }) => {
      if (!onBulletFire) return;

      const config = WEAPON_CONFIGS[weaponTier];
      const bulletSpeed = playerSpeed * speedMultiplier * config.bulletSpeed;

      const bullet: BulletData = {
        id: `bullet-${bulletIdCounter.current++}`,
        position: {
          x: position.x,
          y: position.y + BULLET_Y_OFFSET,
          z: position.z,
        },
        velocity: {
          x: 0,
          y: 0,
          z: bulletSpeed, // Forward direction
        },
        damage: config.damage,
        size: config.bulletSize,
        color: config.bulletColor,
        sourceIndex: soldierIndex,
        createdAt: Date.now(),
      };

      onBulletFire(bullet);
    },
    [onBulletFire, weaponTier, playerSpeed, speedMultiplier]
  );

  if (displayedArmySize <= 0) return null;
  // Now also render during 'endgame' status to show soldiers on stairs
  if (status !== 'playing' && status !== 'countdown' && status !== 'finished' && status !== 'endgame') return null;

  return (
    <group>
      {Array.from({ length: displayedArmySize }).map((_, index) => (
        <ArmySoldier
          key={`army-soldier-${index}`}
          index={index}
          playerX={player.position.x}
          playerZ={player.position.z}
          skinId={currentSkin}
          speedMultiplier={speedMultiplier}
          boulders={nearbyBoulders}
          isEndGame={isEndGame}
          currentClimbedStair={currentClimbedStair}
          soldiersRemaining={soldiersRemaining}
          weaponTier={weaponTier}
          onFire={status === 'playing' ? handleSoldierFire : undefined}
        />
      ))}
    </group>
  );
});

// Export boulder collision type for use in other components
export type { BoulderCollision };
export default ArmyFollowers;
