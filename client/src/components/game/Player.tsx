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

export const playerPath: PathPoint[] = [];

const TRACK_LENGTH = 800;
export const GROUND_Y = 0.5;

export function getAnimationFromSpeed(speedMultiplier: number): AnimationState {
  if (speedMultiplier <= 0.5) return 'walking';
  if (speedMultiplier <= 0.75) return 'jogging';
  if (speedMultiplier <= 1.25) return 'running';
  return 'sprinting';
}

export default function Player() {
  const meshRef = useRef<THREE.Group>(null);
  const characterRef = useRef<CharacterModelRef>(null);
  const lastAnimState = useRef<AnimationState>('idle');

  const currentX = useRef(0);
  const targetX = useRef(0);
  const positionZ = useRef(0);

  const { status, player, updatePlayerPosition, finishGame, speedMultiplier } = useGame();
  const { user } = useAuth();

  const currentSkin = user?.currentSkin || user?.ownedSkins?.[0] || 'default';

  const FORWARD_SPEED = 25;
  const HORIZONTAL_SPEED = 8;
  const SMOOTH_FACTOR = 0.15;
  const TRACK_HALF_WIDTH = GAME_CONSTANTS.TRACK_HALF_WIDTH;

  useEffect(() => {
    if (status === 'loading' || status === 'idle') {
      playerPath.length = 0;
      currentX.current = 0;
      targetX.current = 0;
      positionZ.current = 0;
      lastAnimState.current = 'idle';
    }
  }, [status]);

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

    currentX.current = lerp(currentX.current, targetX.current, SMOOTH_FACTOR);

    const effectiveSpeed = FORWARD_SPEED * speedMultiplier;
    const newZ = positionZ.current + effectiveSpeed * clampedDelta;
    positionZ.current = Math.min(newZ, TRACK_LENGTH);

    meshRef.current.position.x = currentX.current;
    meshRef.current.position.z = positionZ.current;
    meshRef.current.position.y = GROUND_Y;

    updatePlayerPosition(positionZ.current, currentX.current);

    const animState = getAnimationFromSpeed(speedMultiplier);
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