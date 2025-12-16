import { useRef, memo, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  FIST_CONFIG,
  FIST_SIZE,
  FIST_ARM_LENGTH,
  FIST_WINDUP_TIME,
  FIST_PUNCH_TIME,
  FIST_HOLD_TIME,
  FIST_RETRACT_TIME,
  FIST_COOLDOWN_TIME,
} from '../types';
import { GROUND_Y } from '../../../Player';

type FistPhase = 'cooldown' | 'windup' | 'punch' | 'hold' | 'retract';

interface EnemyFistProps {
  side: 'left' | 'right';
  onPhaseChange?: (phase: FistPhase, extension: number) => void;
}

// Returns extension from 0 (retracted) to 1 (fully extended)
function getExtensionForPhase(phase: FistPhase, phaseProgress: number): number {
  switch (phase) {
    case 'cooldown':
      return 0;
    case 'windup':
      // Small pullback animation
      return -0.1 * Math.sin(phaseProgress * Math.PI);
    case 'punch':
      // Rapid extension
      return phaseProgress;
    case 'hold':
      return 1;
    case 'retract':
      // Slow retraction
      return 1 - phaseProgress;
    default:
      return 0;
  }
}

export const EnemyFist = memo(function EnemyFist({
  side,
  onPhaseChange,
}: EnemyFistProps) {
  const armRef = useRef<THREE.Group>(null);
  const fistRef = useRef<THREE.Mesh>(null);
  const cycleTimeRef = useRef(Math.random() * 4); // Random start offset
  const lastPhaseRef = useRef<FistPhase>('cooldown');

  // Materials
  const materials = useMemo(() => ({
    glove: new THREE.MeshStandardMaterial({
      color: FIST_CONFIG.gloveColor,
      roughness: 0.6,
      metalness: 0.1,
    }),
    wrist: new THREE.MeshStandardMaterial({
      color: FIST_CONFIG.wristColor,
      roughness: 0.3,
      metalness: 0.7,
    }),
    arm: new THREE.MeshStandardMaterial({
      color: FIST_CONFIG.armColor,
      roughness: 0.4,
      metalness: 0.8,
    }),
    post: new THREE.MeshStandardMaterial({
      color: FIST_CONFIG.postColor,
      roughness: 0.5,
      metalness: 0.6,
    }),
  }), []);

  // Direction multiplier (1 for left side punching right, -1 for right side punching left)
  const direction = side === 'left' ? 1 : -1;

  useFrame((_, delta) => {
    if (!armRef.current || !fistRef.current) return;

    cycleTimeRef.current += delta;

    // Calculate total cycle time
    const totalCycle = FIST_WINDUP_TIME + FIST_PUNCH_TIME + FIST_HOLD_TIME + FIST_RETRACT_TIME + FIST_COOLDOWN_TIME;
    const cycleProgress = cycleTimeRef.current % totalCycle;

    // Determine current phase
    let phase: FistPhase;
    let phaseProgress: number;

    if (cycleProgress < FIST_COOLDOWN_TIME) {
      phase = 'cooldown';
      phaseProgress = cycleProgress / FIST_COOLDOWN_TIME;
    } else if (cycleProgress < FIST_COOLDOWN_TIME + FIST_WINDUP_TIME) {
      phase = 'windup';
      phaseProgress = (cycleProgress - FIST_COOLDOWN_TIME) / FIST_WINDUP_TIME;
    } else if (cycleProgress < FIST_COOLDOWN_TIME + FIST_WINDUP_TIME + FIST_PUNCH_TIME) {
      phase = 'punch';
      phaseProgress = (cycleProgress - FIST_COOLDOWN_TIME - FIST_WINDUP_TIME) / FIST_PUNCH_TIME;
    } else if (cycleProgress < FIST_COOLDOWN_TIME + FIST_WINDUP_TIME + FIST_PUNCH_TIME + FIST_HOLD_TIME) {
      phase = 'hold';
      phaseProgress = (cycleProgress - FIST_COOLDOWN_TIME - FIST_WINDUP_TIME - FIST_PUNCH_TIME) / FIST_HOLD_TIME;
    } else {
      phase = 'retract';
      phaseProgress = (cycleProgress - FIST_COOLDOWN_TIME - FIST_WINDUP_TIME - FIST_PUNCH_TIME - FIST_HOLD_TIME) / FIST_RETRACT_TIME;
    }

    // Calculate extension
    const extension = getExtensionForPhase(phase, phaseProgress);
    const armX = extension * FIST_ARM_LENGTH * direction;

    // Update arm position
    armRef.current.position.x = armX;

    // Notify parent of phase changes
    if (phase !== lastPhaseRef.current) {
      lastPhaseRef.current = phase;
      onPhaseChange?.(phase, extension);
    }

    // Add slight wobble during punch
    if (phase === 'punch' || phase === 'hold') {
      const wobble = Math.sin(cycleTimeRef.current * 30) * 0.02;
      fistRef.current.position.y = wobble;
    } else {
      fistRef.current.position.y = 0;
    }
  });

  const fistHeight = GROUND_Y + 1.5; // Height of the fist

  return (
    <group position={[0, 0, 0]}>
      {/* Post on the side of track */}
      <mesh
        position={[0, fistHeight / 2, 0]}
        material={materials.post}
        castShadow
      >
        <boxGeometry args={[0.4, fistHeight, 0.4]} />
      </mesh>

      {/* Extendable arm group */}
      <group ref={armRef} position={[0, fistHeight, 0]}>
        {/* Piston arm */}
        <mesh
          position={[direction * FIST_ARM_LENGTH * 0.25, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
          material={materials.arm}
          castShadow
        >
          <cylinderGeometry args={[0.15, 0.15, FIST_ARM_LENGTH * 0.5, 12]} />
        </mesh>

        {/* Wrist band */}
        <mesh
          position={[direction * FIST_ARM_LENGTH * 0.5, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
          material={materials.wrist}
        >
          <cylinderGeometry args={[0.25, 0.25, 0.3, 12]} />
        </mesh>

        {/* Boxing glove (fist) */}
        <mesh
          ref={fistRef}
          position={[direction * (FIST_ARM_LENGTH * 0.5 + FIST_SIZE * 0.6), 0, 0]}
          material={materials.glove}
          castShadow
        >
          <sphereGeometry args={[FIST_SIZE, 16, 12]} />
        </mesh>

        {/* Knuckle details */}
        {[0.3, 0, -0.3].map((zOffset, i) => (
          <mesh
            key={i}
            position={[
              direction * (FIST_ARM_LENGTH * 0.5 + FIST_SIZE * 1.3),
              0.1,
              zOffset,
            ]}
            material={materials.glove}
          >
            <sphereGeometry args={[0.15, 8, 8]} />
          </mesh>
        ))}
      </group>
    </group>
  );
});

// Export phase type for use in collision detection
export type { FistPhase };
export default EnemyFist;
