import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { GAME_CONSTANTS } from '@shared/types/game.types';

// Lerp helper function for smooth interpolation
function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

// Path point for army snake following
export interface PathPoint {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

// Global path storage - exported for Army component to use
export const playerPath: PathPoint[] = [];
const MAX_PATH_LENGTH = 2000; // Store enough points for army trail
const PATH_RECORD_INTERVAL = 16; // Record every ~16ms (60fps)

// Track length constant
const TRACK_LENGTH = 800;
const GROUND_Y = 0.5; // Player height above ground - LOCKED

export default function Player() {
  const meshRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);

  // Current actual position (for lerp)
  const currentX = useRef(0);
  const targetX = useRef(0);
  const positionZ = useRef(0);
  const lastPathRecord = useRef(0);

  const { status, player, updatePlayerPosition, finishGame } = useGameStore();

  // Movement constants - tuned for smooth feel
  const FORWARD_SPEED = GAME_CONSTANTS.BASE_SPEED; // 50 m/s
  const HORIZONTAL_SPEED = 8; // m/s for left/right movement
  const SMOOTH_FACTOR = 0.15; // Lerp factor for smoothness (higher = snappier)
  const TRACK_HALF_WIDTH = GAME_CONSTANTS.TRACK_HALF_WIDTH; // 5m

  // Clear path on game reset
  useEffect(() => {
    if (status === 'loading' || status === 'idle') {
      playerPath.length = 0;
      currentX.current = 0;
      targetX.current = 0;
      positionZ.current = 0;
      lastPathRecord.current = 0;
    }
  }, [status]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Only move when playing
    if (status !== 'playing') {
      // Still update mesh position but don't move
      meshRef.current.position.y = GROUND_Y; // ALWAYS lock Y
      return;
    }

    // Check if already finished (stop at finish line)
    if (positionZ.current >= TRACK_LENGTH) {
      // Ensure we trigger finish exactly once
      if (status === 'playing') {
        finishGame();
      }
      return;
    }

    // Clamp delta to prevent large jumps on lag spikes
    const clampedDelta = Math.min(delta, 0.05);

    // Update target X based on horizontal velocity (continuous while held)
    if (player.horizontalVelocity !== 0) {
      targetX.current += player.horizontalVelocity * HORIZONTAL_SPEED * clampedDelta;
    }

    // Clamp target to track bounds
    targetX.current = Math.max(-TRACK_HALF_WIDTH, Math.min(TRACK_HALF_WIDTH, targetX.current));

    // SMOOTH interpolation (lerp) - this is the key to smooth movement!
    currentX.current = lerp(currentX.current, targetX.current, SMOOTH_FACTOR);

    // Move forward constantly (but stop at finish)
    const newZ = positionZ.current + FORWARD_SPEED * clampedDelta;
    positionZ.current = Math.min(newZ, TRACK_LENGTH); // Cap at track length

    // Update mesh position - Y is ALWAYS locked to ground
    meshRef.current.position.x = currentX.current;
    meshRef.current.position.z = positionZ.current;
    meshRef.current.position.y = GROUND_Y; // LOCKED - no floating!

    // Update store with position
    updatePlayerPosition(positionZ.current, currentX.current);

    // Record path for army following (throttled)
    const now = state.clock.elapsedTime * 1000;
    if (now - lastPathRecord.current >= PATH_RECORD_INTERVAL) {
      playerPath.push({
        x: currentX.current,
        y: GROUND_Y,
        z: positionZ.current,
        timestamp: now,
      });

      // Trim old path data
      if (playerPath.length > MAX_PATH_LENGTH) {
        playerPath.shift();
      }

      lastPathRecord.current = now;
    }

    // Add subtle body rotation based on movement direction
    if (bodyRef.current) {
      // Roll effect when moving sideways
      const targetRotation = -player.horizontalVelocity * 0.15;
      bodyRef.current.rotation.z = lerp(bodyRef.current.rotation.z, targetRotation, 0.1);

      // Spin effect for forward movement (like rolling)
      bodyRef.current.rotation.x += clampedDelta * FORWARD_SPEED * 0.3;
    }
  });

  return (
    <group ref={meshRef} position={[0, GROUND_Y, 0]}>
      {/* Main body - capsule shape */}
      <mesh ref={bodyRef} castShadow>
        <capsuleGeometry args={[0.35, 0.6, 8, 16]} />
        <meshStandardMaterial
          color="#4ECDC4"
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial
          color="#45B7D1"
          metalness={0.4}
          roughness={0.6}
        />
      </mesh>

      {/* Eyes - facing forward (positive Z) */}
      <mesh position={[0.1, 0.75, 0.2]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color="white" />
      </mesh>
      <mesh position={[-0.1, 0.75, 0.2]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color="white" />
      </mesh>

      {/* Pupils */}
      <mesh position={[0.1, 0.75, 0.24]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color="black" />
      </mesh>
      <mesh position={[-0.1, 0.75, 0.24]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color="black" />
      </mesh>
    </group>
  );
}
