// TieredArmyFollowers.tsx - Army system using tiered soldiers for performance
// Max 10 physical soldiers, each representing multiple soldiers via levels

import { useRef, memo, useState, useEffect, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/context';
import { useAuth } from '@/hooks/useAuth';
import { GROUND_Y, getAnimationFromSpeed } from '../Player';
import { STAIR_CONSTANTS, GAME_CONSTANTS } from '@shared/types/game.types';
import { TRACK_LENGTH } from '../Track/config';
import { WeaponModel } from '../weapons/WeaponModel';
import { WeaponTier, WEAPON_CONFIGS, BulletData, BULLET_Y_OFFSET } from '../weapons/types';
import { TieredSoldierModel } from './TieredSoldierModel';
import {
  TieredSoldier,
  distributeSoldiers,
  getSoldierTierVisuals,
  MAX_VISIBLE_SOLDIERS,
} from './SoldierTierSystem';
import { getSkinConfig } from '../characters/types';

// Calculate stairs start position
const STAIRS_START_Z = TRACK_LENGTH + 10;

// Formation constants
const SOLDIERS_PER_ROW = 4;
const SPACING_X = 1.2;
const SPACING_Z = 1.4;
const BACK_OFFSET = -2.0;

// Seeded random for consistent randomization
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

// Boulder collision data
interface BoulderCollision {
  x: number;
  z: number;
  radius: number;
}

function getFormationPosition(
  index: number,
  totalSoldiers: number,
  playerX: number,
  playerZ: number
): { x: number; y: number; z: number } {
  // Use dynamic rows based on total soldiers
  const soldiersPerRow = Math.min(SOLDIERS_PER_ROW, totalSoldiers);
  const row = Math.floor(index / soldiersPerRow);
  const col = index % soldiersPerRow;

  const baseXOffset = (col - (soldiersPerRow - 1) / 2) * SPACING_X;
  const baseZOffset = BACK_OFFSET - row * SPACING_Z;

  // Random offset for organic feel
  const seedX = index * 7 + 13;
  const seedZ = index * 11 + 17;
  const randomXOffset = (seededRandom(seedX) - 0.5) * 0.4;
  const randomZOffset = (seededRandom(seedZ) - 0.5) * 0.3;

  return {
    x: playerX + baseXOffset + randomXOffset,
    y: GROUND_Y,
    z: playerZ + baseZOffset + randomZOffset,
  };
}

function applyBoulderCollision(
  posX: number,
  posZ: number,
  boulders: BoulderCollision[],
  soldierRadius: number = 0.4
): { x: number; z: number } {
  let resultX = posX;
  let resultZ = posZ;

  for (const boulder of boulders) {
    const dx = resultX - boulder.x;
    const dz = resultZ - boulder.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    const minDistance = boulder.radius + soldierRadius;

    if (distance < minDistance && distance > 0.01) {
      const pushFactor = (minDistance - distance) / distance;
      resultX += dx * pushFactor * 1.2;
      resultZ += dz * pushFactor * 1.2;
    }
  }

  return { x: resultX, z: resultZ };
}

interface TieredSoldierUnitProps {
  soldier: TieredSoldier;
  totalSoldiers: number;
  playerX: number;
  playerZ: number;
  skinId: string;
  speedMultiplier: number;
  boulders: BoulderCollision[];
  isEndGame: boolean;
  weaponTier: WeaponTier;
  onFire?: (soldierValue: number, position: { x: number; y: number; z: number }) => void;
}

const TieredSoldierUnit = memo(function TieredSoldierUnit({
  soldier,
  totalSoldiers,
  playerX,
  playerZ,
  skinId,
  speedMultiplier,
  boulders,
  isEndGame,
  weaponTier,
  onFire,
}: TieredSoldierUnitProps) {
  const groupRef = useRef<THREE.Group>(null);
  const lastFireTime = useRef(0);

  // Get skin colors
  const skinConfig = useMemo(() => getSkinConfig(skinId), [skinId]);
  const skinColors = {
    skin: skinConfig.colors.skin,
    shirt: skinConfig.colors.shirt,
    pants: skinConfig.colors.pants,
    shoes: skinConfig.colors.shoes,
    hair: skinConfig.colors.hair,
  };

  // Animation and position state
  const animPhaseOffset = seededRandom(soldier.id * 23 + 7) * Math.PI * 2;
  const wobbleFrequency = 1.5 + seededRandom(soldier.id * 31 + 11) * 1.0;
  const wobbleAmplitude = 0.02 + seededRandom(soldier.id * 37 + 13) * 0.02;

  // Fire rate scales with soldier value (higher tier = more bullets)
  const fireRateMultiplier = 1 + (soldier.level - 1) * 0.5; // Level 1 = 1x, Level 10 = 5.5x

  const currentPos = useRef({
    x: playerX,
    y: GROUND_Y,
    z: playerZ + BACK_OFFSET - Math.floor(soldier.id / SOLDIERS_PER_ROW) * SPACING_Z,
  });

  useFrame((state) => {
    if (!groupRef.current) return;

    let targetX: number;
    let targetY: number;
    let targetZ: number;
    const smoothFactor = 0.12;

    // Normal following
    const target = getFormationPosition(soldier.id, totalSoldiers, playerX, playerZ);
    targetX = target.x;
    targetY = target.y;
    targetZ = target.z;

    // Apply boulder collision
    if (boulders.length > 0) {
      const collisionResult = applyBoulderCollision(targetX, targetZ, boulders);
      targetX = collisionResult.x;
      targetZ = collisionResult.z;
    }

    // Add wobble
    if (!isEndGame) {
      const time = state.clock.elapsedTime;
      const wobble = Math.sin(time * wobbleFrequency * Math.PI * 2 + animPhaseOffset) * wobbleAmplitude;
      targetX += wobble;
    }

    // Smooth position update
    currentPos.current.x = lerp(currentPos.current.x, targetX, smoothFactor);
    currentPos.current.y = lerp(currentPos.current.y, targetY, smoothFactor);
    currentPos.current.z = lerp(currentPos.current.z, targetZ, smoothFactor);

    groupRef.current.position.set(
      currentPos.current.x,
      currentPos.current.y,
      currentPos.current.z
    );

    // Shooting logic - simple: fire every 1 second
    if (!isEndGame && onFire) {
      const now = Date.now();
      const fireInterval = 1000; // 1 bullet per second, simple and clear

      if (now - lastFireTime.current >= fireInterval) {
        // Fire one bullet from this soldier
        onFire(soldier.value, {
          x: currentPos.current.x,
          y: currentPos.current.y + 0.6, // At weapon height
          z: currentPos.current.z + 0.3, // Slightly forward
        });
        lastFireTime.current = now;

        // Debug log
        console.log(`Soldier ${soldier.id} fired! Value: ${soldier.value}`);
      }
    }
  });

  const tier = getSoldierTierVisuals(soldier.value);

  return (
    <group ref={groupRef} position={[currentPos.current.x, currentPos.current.y, currentPos.current.z]}>
      <TieredSoldierModel
        soldier={soldier}
        skinColors={skinColors}
        animation={isEndGame ? 'idle' : getAnimationFromSpeed(speedMultiplier)}
      />
      {/* Weapon - positioned in front */}
      <group position={[0.3, 0.6, 0.3]} rotation={[0, 0.3, 0]}>
        <WeaponModel tier={weaponTier} scale={tier.sizeMultiplier * 0.4} />
      </group>
      {/* Value badge */}
      {soldier.value > 1 && (
        <group position={[0, 1.3 * tier.sizeMultiplier, 0]}>
          <sprite scale={[0.4, 0.2, 1]}>
            <spriteMaterial color={tier.glowColor || '#ffffff'} />
          </sprite>
        </group>
      )}
    </group>
  );
});

interface TieredArmyFollowersProps {
  armySize: number;
  boulders?: BoulderCollision[];
  weaponTier?: WeaponTier;
  onBulletFire?: (bullet: BulletData) => void;
  playerSpeed?: number;
}

export const TieredArmyFollowers = memo(function TieredArmyFollowers({
  armySize,
  boulders = [],
  weaponTier = 1,
  onBulletFire,
  playerSpeed = GAME_CONSTANTS.BASE_SPEED,
}: TieredArmyFollowersProps) {
  const { player, status, speedMultiplier, endGameState } = useGame();
  const { user } = useAuth();
  const bulletIdCounter = useRef(0);

  // Calculate tiered soldiers from total army size
  const tieredSoldiers = useMemo(() => {
    return distributeSoldiers(armySize);
  }, [armySize]);

  // Filter boulders near player
  const nearbyBoulders = boulders.filter(
    (b) => Math.abs(b.z - player.position.z) < 20
  );

  const currentSkin = user?.currentSkin || user?.ownedSkins?.[0] || 'default';
  const isEndGame = status === 'endgame';

  // Handle bullet firing
  const handleSoldierFire = useCallback(
    (soldierValue: number, position: { x: number; y: number; z: number }) => {
      if (!onBulletFire) return;

      const config = WEAPON_CONFIGS[weaponTier];
      const bulletSpeed = playerSpeed * speedMultiplier * config.bulletSpeed;

      // Spread bullets horizontally to cover the track width and hit gates
      const spreadX = (Math.random() - 0.5) * 12; // Spread across track width (-6 to +6)

      const bullet: BulletData = {
        id: `bullet-${bulletIdCounter.current++}`,
        position: {
          x: position.x,
          y: position.y + BULLET_Y_OFFSET,
          z: position.z,
        },
        velocity: {
          x: spreadX, // Fan out to hit gates on both sides
          y: 0,
          z: bulletSpeed,
        },
        damage: soldierValue, // Soldier value = bullet damage (soldier worth 8 = bullet does 8 damage)
        size: config.bulletSize,
        color: config.bulletColor,
        sourceIndex: soldierValue, // Store soldier value for damage popup display
        createdAt: Date.now(),
      };

      onBulletFire(bullet);
    },
    [onBulletFire, weaponTier, playerSpeed, speedMultiplier]
  );

  if (tieredSoldiers.length === 0) return null;
  if (status !== 'playing' && status !== 'countdown' && status !== 'finished' && status !== 'endgame') return null;

  return (
    <group>
      {tieredSoldiers.map((soldier) => (
        <TieredSoldierUnit
          key={`tiered-soldier-${soldier.id}`}
          soldier={soldier}
          totalSoldiers={tieredSoldiers.length}
          playerX={player.position.x}
          playerZ={player.position.z}
          skinId={currentSkin}
          speedMultiplier={speedMultiplier}
          boulders={nearbyBoulders}
          isEndGame={isEndGame}
          weaponTier={weaponTier}
          onFire={status === 'playing' ? handleSoldierFire : undefined}
        />
      ))}
    </group>
  );
});

export type { BoulderCollision };
export default TieredArmyFollowers;
