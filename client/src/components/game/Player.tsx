import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { GAME_CONSTANTS } from '@shared/types/game.types';

// Lerp helper function for smooth interpolation
function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

// Path point for army snake following (exported for backward compatibility)
export interface PathPoint {
  position: THREE.Vector3;
  rotation: THREE.Quaternion;
  timestamp: number;
}

// Global path storage (exported for backward compatibility)
export const playerPath: PathPoint[] = [];

export default function Player() {
  const meshRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);

  // Current actual position (for lerp)
  const currentX = useRef(0);
  const targetX = useRef(0);
  const positionZ = useRef(0);

  const { status, player, updatePlayerPosition } = useGameStore();

  // Movement constants - tuned for smooth feel
  const FORWARD_SPEED = GAME_CONSTANTS.BASE_SPEED; // 50 m/s
  const HORIZONTAL_SPEED = 8; // m/s for left/right movement
  const SMOOTH_FACTOR = 0.15; // Lerp factor for smoothness (higher = snappier)
  const TRACK_HALF_WIDTH = GAME_CONSTANTS.TRACK_HALF_WIDTH; // 5m

  useFrame((_, delta) => {
    if (status !== 'playing' || !meshRef.current) return;

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

    // Move forward constantly
    positionZ.current += FORWARD_SPEED * clampedDelta;

    // Update mesh position
    meshRef.current.position.x = currentX.current;
    meshRef.current.position.z = positionZ.current;
    meshRef.current.position.y = 0.5; // Slightly above ground

    // Update store with position
    updatePlayerPosition(positionZ.current, currentX.current);

    // Add subtle body rotation based on movement direction
    if (bodyRef.current) {
      // Roll effect when moving sideways
      const targetRotation = -player.horizontalVelocity * 0.15;
      bodyRef.current.rotation.z = lerp(bodyRef.current.rotation.z, targetRotation, 0.1);

      // Spin effect for forward movement
      bodyRef.current.rotation.x += clampedDelta * FORWARD_SPEED * 0.3;
    }
  });

  return (
    <group ref={meshRef} position={[0, 0.5, 0]}>
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
