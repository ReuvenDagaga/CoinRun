import { useRef, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CharacterModel } from './characters';
import { GROUND_Y } from './Player';

export interface DeadSoldierData {
  id: string;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  rotationSpeed: { x: number; y: number; z: number };
  timeOfDeath: number;
  skinId: string;
}

// Physics constants
const GRAVITY = 15; // Units per second squared
const GROUND_FRICTION = 0.85; // Velocity multiplier on ground contact
const AIR_RESISTANCE = 0.98; // Velocity multiplier per frame
const FADE_START_TIME = 2.0; // Start fading after 2 seconds
const FADE_DURATION = 1.0; // Fade over 1 second
const TOTAL_LIFETIME = 3.0; // Remove after 3 seconds

interface DeadSoldierProps {
  data: DeadSoldierData;
  onRemove: (id: string) => void;
  currentTime: number;
}

const SingleDeadSoldier = memo(function SingleDeadSoldier({
  data,
  onRemove,
  currentTime,
}: DeadSoldierProps) {
  const groupRef = useRef<THREE.Group>(null);
  const positionRef = useRef({ ...data.position });
  const velocityRef = useRef({ ...data.velocity });
  const rotationRef = useRef({ ...data.rotation });
  const rotationSpeedRef = useRef({ ...data.rotationSpeed });
  const onGroundRef = useRef(false);
  const opacityRef = useRef(1);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const timeSinceDeath = currentTime - data.timeOfDeath;

    // Check if should be removed
    if (timeSinceDeath >= TOTAL_LIFETIME) {
      onRemove(data.id);
      return;
    }

    // Apply gravity
    velocityRef.current.y -= GRAVITY * delta;

    // Apply air resistance
    velocityRef.current.x *= AIR_RESISTANCE;
    velocityRef.current.z *= AIR_RESISTANCE;

    // Update position
    positionRef.current.x += velocityRef.current.x * delta;
    positionRef.current.y += velocityRef.current.y * delta;
    positionRef.current.z += velocityRef.current.z * delta;

    // Ground collision
    if (positionRef.current.y <= GROUND_Y) {
      positionRef.current.y = GROUND_Y;

      if (!onGroundRef.current) {
        // First ground contact - apply friction and reduce bounce
        velocityRef.current.y = Math.abs(velocityRef.current.y) * 0.2; // Small bounce
        velocityRef.current.x *= GROUND_FRICTION;
        velocityRef.current.z *= GROUND_FRICTION;
        rotationSpeedRef.current.x *= 0.5;
        rotationSpeedRef.current.z *= 0.5;
        onGroundRef.current = true;
      } else {
        // On ground - stop vertical movement, slow horizontal
        velocityRef.current.y = 0;
        velocityRef.current.x *= 0.95;
        velocityRef.current.z *= 0.95;
        rotationSpeedRef.current.x *= 0.9;
        rotationSpeedRef.current.z *= 0.9;
      }
    }

    // Update rotation (tumbling effect)
    rotationRef.current.x += rotationSpeedRef.current.x * delta;
    rotationRef.current.z += rotationSpeedRef.current.z * delta;

    // Calculate opacity for fade out
    if (timeSinceDeath >= FADE_START_TIME) {
      const fadeProgress = (timeSinceDeath - FADE_START_TIME) / FADE_DURATION;
      opacityRef.current = Math.max(0, 1 - fadeProgress);
    }

    // Update group transform
    groupRef.current.position.set(
      positionRef.current.x,
      positionRef.current.y,
      positionRef.current.z
    );
    groupRef.current.rotation.set(
      rotationRef.current.x,
      rotationRef.current.y,
      rotationRef.current.z
    );

    // Apply opacity to all meshes
    groupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material as THREE.MeshStandardMaterial;
        if (material.transparent !== undefined) {
          material.transparent = true;
          material.opacity = opacityRef.current;
        }
      }
    });
  });

  return (
    <group ref={groupRef} position={[data.position.x, data.position.y, data.position.z]}>
      <CharacterModel
        skinId={data.skinId}
        animation="idle"
        scale={1}
      />
    </group>
  );
});

interface DeadSoldiersRendererProps {
  deadSoldiers: DeadSoldierData[];
  onRemove: (id: string) => void;
  currentTime: number;
}

export const DeadSoldiersRenderer = memo(function DeadSoldiersRenderer({
  deadSoldiers,
  onRemove,
  currentTime,
}: DeadSoldiersRendererProps) {
  return (
    <group>
      {deadSoldiers.map((soldier) => (
        <SingleDeadSoldier
          key={soldier.id}
          data={soldier}
          onRemove={onRemove}
          currentTime={currentTime}
        />
      ))}
    </group>
  );
});

// Helper function to create dead soldier data from a death event
export function createDeadSoldier(
  position: { x: number; z: number },
  enemyPosition: { x: number; z: number },
  enemyRotation: number, // Current rotation of the spinner in radians
  skinId: string,
  currentTime: number
): DeadSoldierData {
  // Calculate push direction based on spinner rotation
  // The spike that hit the soldier was pointing in this direction
  const spikeAngle = enemyRotation;

  // Calculate direction from enemy to soldier
  const dx = position.x - enemyPosition.x;
  const dz = position.z - enemyPosition.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  const dirX = dist > 0 ? dx / dist : Math.cos(spikeAngle);
  const dirZ = dist > 0 ? dz / dist : Math.sin(spikeAngle);

  // Add tangential velocity from spinner rotation (perpendicular to radial direction)
  const tangentX = -dirZ;
  const tangentZ = dirX;

  // Combine radial push with tangential velocity
  const pushStrength = 8 + Math.random() * 4; // 8-12 units/s
  const tangentStrength = 3 + Math.random() * 2; // 3-5 units/s
  const upwardStrength = 5 + Math.random() * 3; // 5-8 units/s upward

  return {
    id: `dead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    position: {
      x: position.x,
      y: GROUND_Y + 0.1, // Slightly above ground
      z: position.z,
    },
    velocity: {
      x: dirX * pushStrength + tangentX * tangentStrength,
      y: upwardStrength,
      z: dirZ * pushStrength + tangentZ * tangentStrength,
    },
    rotation: {
      x: 0,
      y: Math.atan2(dirX, dirZ), // Face away from enemy
      z: 0,
    },
    rotationSpeed: {
      x: (Math.random() - 0.5) * 8, // Random tumble
      y: 0,
      z: (Math.random() - 0.5) * 6,
    },
    timeOfDeath: currentTime,
    skinId,
  };
}

export default DeadSoldiersRenderer;
