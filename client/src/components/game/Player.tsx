import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/context';
import { useAuth } from '@/hooks/useAuth';
import { GAME_CONSTANTS } from '@shared/types/game.types';
import { CharacterModel, CharacterModelRef, AnimationState } from './characters';

function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

export interface PathPoint {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

// Boulder collision data
export interface BoulderCollision {
  x: number;
  z: number;
  radius: number;
}

export const playerPath: PathPoint[] = [];

const TRACK_LENGTH = 800;
export const GROUND_Y = 0.5;

// Boulder collision speed reduction
const BOULDER_SPEED_MULTIPLIER = 0.2; // 80% speed reduction when touching boulder

export function getAnimationFromSpeed(speedMultiplier: number): AnimationState {
  if (speedMultiplier <= 0.5) return 'walking';
  if (speedMultiplier <= 0.75) return 'jogging';
  if (speedMultiplier <= 1.25) return 'running';
  return 'sprinting';
}

interface PlayerProps {
  boulders?: BoulderCollision[];
}

export default function Player({ boulders = [] }: PlayerProps) {
  const meshRef = useRef<THREE.Group>(null);
  const characterRef = useRef<CharacterModelRef>(null);
  const lastAnimState = useRef<AnimationState>('idle');

  const currentX = useRef(0);
  const targetX = useRef(0);
  const positionZ = useRef(0);

  const { status, player, updatePlayerPosition, finishGame, speedMultiplier } = useGame();
  const { user } = useAuth();

  const currentSkin = user?.currentSkin || user?.ownedSkins?.[0] || 'default';

  // Base speed reduced by 30% again (was 17.5, now 12.25)
  const FORWARD_SPEED = 12.25;
  const HORIZONTAL_SPEED = 8;
  const SMOOTH_FACTOR = 0.15;
  const TRACK_HALF_WIDTH = GAME_CONSTANTS.TRACK_HALF_WIDTH;
  const PLAYER_RADIUS = 0.4;

  useEffect(() => {
    if (status === 'loading' || status === 'idle') {
      playerPath.length = 0;
      currentX.current = 0;
      targetX.current = 0;
      positionZ.current = 0;
      lastAnimState.current = 'idle';
    }
  }, [status]);

  // Apply boulder collision to player position
  const applyBoulderCollision = (posX: number, posZ: number): { x: number; z: number; touchingBoulder: boolean } => {
    let resultX = posX;
    let resultZ = posZ;
    let touchingBoulder = false;

    // Filter to nearby boulders
    const nearbyBoulders = boulders.filter(
      (b) => Math.abs(b.z - posZ) < 10
    );

    for (const boulder of nearbyBoulders) {
      const dx = resultX - boulder.x;
      const dz = resultZ - boulder.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      const minDistance = boulder.radius + PLAYER_RADIUS;

      if (distance < minDistance && distance > 0.01) {
        touchingBoulder = true;
        // Push player out of boulder
        const pushFactor = (minDistance - distance) / distance;
        resultX += dx * pushFactor * 1.1;
        // Don't push backward in Z, player should go around
        if (dz > 0) {
          resultZ += dz * pushFactor * 0.5;
        }
      }
    }

    return { x: resultX, z: resultZ, touchingBoulder };
  };

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    if (status === 'idle' || status === 'loading' || status === 'countdown') {
      if (lastAnimState.current !== 'idle') {
        characterRef.current?.setAnimation('idle');
        lastAnimState.current = 'idle';
      }
      meshRef.current.position.y = GROUND_Y;
      return;
    }

    if (status !== 'playing') {
      meshRef.current.position.y = GROUND_Y;
      return;
    }

    if (positionZ.current >= TRACK_LENGTH) {
      if (status === 'playing') {
        finishGame();
      }
      return;
    }

    const clampedDelta = Math.min(delta, 0.05);

    if (player.horizontalVelocity !== 0) {
      targetX.current += player.horizontalVelocity * HORIZONTAL_SPEED * clampedDelta;
    }

    targetX.current = Math.max(-TRACK_HALF_WIDTH, Math.min(TRACK_HALF_WIDTH, targetX.current));

    let newX = lerp(currentX.current, targetX.current, SMOOTH_FACTOR);

    // Check boulder collision first to determine speed
    let boulderSpeedMod = 1.0;
    if (boulders.length > 0) {
      const collision = applyBoulderCollision(newX, positionZ.current);
      if (collision.touchingBoulder) {
        boulderSpeedMod = BOULDER_SPEED_MULTIPLIER; // 80% speed reduction
      }
    }

    // Apply speed with boulder modifier
    const effectiveSpeed = FORWARD_SPEED * speedMultiplier * boulderSpeedMod;
    let newZ = positionZ.current + effectiveSpeed * clampedDelta;
    newZ = Math.min(newZ, TRACK_LENGTH);

    // Apply boulder collision for position
    if (boulders.length > 0) {
      const collision = applyBoulderCollision(newX, newZ);
      newX = collision.x;
      newZ = Math.max(positionZ.current, collision.z); // Don't go backward

      // Update target if touching boulder to prevent fighting against boulder
      if (collision.touchingBoulder) {
        targetX.current = newX;
      }
    }

    // Clamp X to track bounds after collision
    newX = Math.max(-TRACK_HALF_WIDTH, Math.min(TRACK_HALF_WIDTH, newX));

    currentX.current = newX;
    positionZ.current = newZ;

    meshRef.current.position.x = currentX.current;
    meshRef.current.position.z = positionZ.current;
    meshRef.current.position.y = GROUND_Y;

    updatePlayerPosition(positionZ.current, currentX.current);

    // Animation based on effective speed (including boulder slow)
    const animState = getAnimationFromSpeed(speedMultiplier * boulderSpeedMod);
    if (animState !== lastAnimState.current) {
      characterRef.current?.setAnimation(animState);
      lastAnimState.current = animState;
    }
  });

  return (
    <group ref={meshRef} position={[0, GROUND_Y, 0]}>
      <CharacterModel
        ref={characterRef}
        skinId={currentSkin}
        animation="idle"
        scale={1.5}
      />
    </group>
  );
}
