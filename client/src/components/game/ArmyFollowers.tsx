import { useRef, memo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/context';
import { useAuth } from '@/hooks/useAuth';
import { CharacterModel, CharacterModelRef } from './characters';
import { GROUND_Y, getAnimationFromSpeed } from './Player';

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

interface ArmySoldierProps {
  index: number;
  playerX: number;
  playerZ: number;
  skinId: string;
  speedMultiplier: number;
  boulders: BoulderCollision[];
}

const ArmySoldier = memo(function ArmySoldier({
  index,
  playerX,
  playerZ,
  skinId,
  speedMultiplier,
  boulders,
}: ArmySoldierProps) {
  const groupRef = useRef<THREE.Group>(null);
  const characterRef = useRef<CharacterModelRef>(null);
  const lastAnimState = useRef(getAnimationFromSpeed(speedMultiplier));

  // Each soldier has a unique animation phase offset and wobble frequency
  const animPhaseOffset = seededRandom(index * 23 + 7) * Math.PI * 2;
  const wobbleFrequency = 1.5 + seededRandom(index * 31 + 11) * 1.0; // 1.5-2.5 Hz
  const wobbleAmplitude = 0.02 + seededRandom(index * 37 + 13) * 0.02; // 0.02-0.04 units

  const currentPos = useRef({
    x: playerX,
    y: GROUND_Y,
    z: playerZ + BACK_OFFSET - Math.floor(index / SOLDIERS_PER_ROW) * SPACING_Z,
  });

  useFrame((state) => {
    if (!groupRef.current) return;

    const target = getFormationPosition(index, playerX, playerZ);

    // Smoother lerp factor for natural following
    const smoothFactor = 0.15;
    let newX = lerp(currentPos.current.x, target.x, smoothFactor);
    let newZ = lerp(currentPos.current.z, target.z, smoothFactor);

    // Apply boulder collision
    if (boulders.length > 0) {
      const collisionResult = applyBoulderCollision(newX, newZ, boulders);
      newX = collisionResult.x;
      newZ = collisionResult.z;
    }

    currentPos.current.x = newX;
    currentPos.current.z = newZ;
    currentPos.current.y = GROUND_Y;

    // Add subtle side-to-side wobble unique to each soldier
    const time = state.clock.elapsedTime;
    const wobble = Math.sin(time * wobbleFrequency * Math.PI * 2 + animPhaseOffset) * wobbleAmplitude;

    groupRef.current.position.set(
      currentPos.current.x + wobble,
      currentPos.current.y,
      currentPos.current.z
    );

    const animState = getAnimationFromSpeed(speedMultiplier);
    if (animState !== lastAnimState.current) {
      characterRef.current?.setAnimation(animState);
      lastAnimState.current = animState;
    }
  });

  return (
    <group ref={groupRef} position={[currentPos.current.x, GROUND_Y, currentPos.current.z]}>
      <CharacterModel
        ref={characterRef}
        skinId={skinId}
        animation={getAnimationFromSpeed(speedMultiplier)}
        scale={1}
      />
    </group>
  );
});

interface ArmyFollowersProps {
  armySize: number;
  boulders?: BoulderCollision[];
}

export const ArmyFollowers = memo(function ArmyFollowers({
  armySize,
  boulders = [],
}: ArmyFollowersProps) {
  const { player, status, speedMultiplier } = useGame();
  const { user } = useAuth();

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

  if (displayedArmySize <= 0) return null;
  if (status !== 'playing' && status !== 'countdown' && status !== 'finished') return null;

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
        />
      ))}
    </group>
  );
});

// Export boulder collision type for use in other components
export type { BoulderCollision };
export default ArmyFollowers;
