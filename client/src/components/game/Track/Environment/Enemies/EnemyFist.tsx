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
      // Rapid extension with easing
      return phaseProgress * phaseProgress; // Quadratic ease-in for acceleration feel
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
  const warningRef = useRef<THREE.Mesh>(null);
  const fistGlowRef = useRef<THREE.PointLight>(null);
  const impactParticlesRef = useRef<THREE.Group>(null);
  const cycleTimeRef = useRef(Math.random() * 4); // Random start offset
  const lastPhaseRef = useRef<FistPhase>('cooldown');

  // Materials - including danger state materials
  const materials = useMemo(() => ({
    glove: new THREE.MeshStandardMaterial({
      color: FIST_CONFIG.gloveColor,
      roughness: 0.6,
      metalness: 0.1,
    }),
    gloveDanger: new THREE.MeshStandardMaterial({
      color: '#FF4400',
      emissive: '#FF2200',
      emissiveIntensity: 2,
      roughness: 0.4,
      metalness: 0.2,
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
    warning: new THREE.MeshStandardMaterial({
      color: '#FF0000',
      emissive: '#FF0000',
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    }),
    warningEdge: new THREE.MeshStandardMaterial({
      color: '#FFFF00',
      emissive: '#FFFF00',
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.8,
    }),
    impact: new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      emissive: '#FFFF00',
      emissiveIntensity: 3,
      transparent: true,
      opacity: 0.9,
    }),
    speedLine: new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      emissive: '#FFFFFF',
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.6,
    }),
  }), []);

  // Direction multiplier (1 for left side punching right, -1 for right side punching left)
  const direction = side === 'left' ? 1 : -1;
  const fistHeight = GROUND_Y + 1.5; // Height of the fist

  useFrame((state, delta) => {
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

    // Update warning indicator visibility and pulsing
    if (warningRef.current) {
      const showWarning = phase === 'windup' || phase === 'cooldown' && phaseProgress > 0.7;
      if (showWarning) {
        warningRef.current.visible = true;
        // Pulsing effect
        const pulse = 0.3 + Math.sin(state.clock.elapsedTime * 10) * 0.2;
        (warningRef.current.material as THREE.MeshStandardMaterial).opacity = pulse;
      } else {
        warningRef.current.visible = false;
      }
    }

    // Update fist glow during danger phases
    const isDanger = phase === 'punch' || phase === 'hold';
    if (fistGlowRef.current) {
      if (isDanger) {
        fistGlowRef.current.intensity = 3 + Math.sin(state.clock.elapsedTime * 20) * 1;
      } else {
        fistGlowRef.current.intensity = 0;
      }
    }

    // Change fist material based on danger state
    if (fistRef.current) {
      (fistRef.current as THREE.Mesh).material = isDanger ? materials.gloveDanger : materials.glove;
    }

    // Impact particles when fully extended
    if (impactParticlesRef.current) {
      if (phase === 'hold' && phaseProgress < 0.3) {
        impactParticlesRef.current.visible = true;
        impactParticlesRef.current.scale.setScalar(1 + phaseProgress * 2);
        impactParticlesRef.current.children.forEach((child, i) => {
          const mesh = child as THREE.Mesh;
          if (mesh.material) {
            (mesh.material as THREE.MeshStandardMaterial).opacity = 0.9 - phaseProgress * 3;
          }
        });
      } else {
        impactParticlesRef.current.visible = false;
      }
    }

    // Notify parent of phase changes
    if (phase !== lastPhaseRef.current) {
      lastPhaseRef.current = phase;
      onPhaseChange?.(phase, extension);
    }

    // Add wobble during punch/hold
    if (phase === 'punch' || phase === 'hold') {
      const wobble = Math.sin(cycleTimeRef.current * 30) * 0.03;
      fistRef.current.position.y = wobble;
    } else {
      fistRef.current.position.y = 0;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Ground warning indicator - shows punch path */}
      <mesh
        ref={warningRef}
        position={[direction * FIST_ARM_LENGTH * 0.5, 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={materials.warning}
        visible={false}
      >
        <planeGeometry args={[FIST_ARM_LENGTH + 2, 3]} />
      </mesh>

      {/* Warning edge markers */}
      <mesh
        position={[direction * FIST_ARM_LENGTH * 0.5, 0.03, 1.5]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={materials.warningEdge}
        visible={warningRef.current?.visible}
      >
        <planeGeometry args={[FIST_ARM_LENGTH + 2, 0.2]} />
      </mesh>
      <mesh
        position={[direction * FIST_ARM_LENGTH * 0.5, 0.03, -1.5]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={materials.warningEdge}
        visible={warningRef.current?.visible}
      >
        <planeGeometry args={[FIST_ARM_LENGTH + 2, 0.2]} />
      </mesh>

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
        {/* Speed lines during punch (motion blur effect) */}
        {[0.2, 0.4, 0.6].map((offset, i) => (
          <mesh
            key={`speed-${i}`}
            position={[-direction * offset * 2, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
            material={materials.speedLine}
          >
            <planeGeometry args={[0.3, 1.5 - i * 0.3]} />
          </mesh>
        ))}

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

        {/* Fist glow light (danger indicator) */}
        <pointLight
          ref={fistGlowRef}
          position={[direction * (FIST_ARM_LENGTH * 0.5 + FIST_SIZE * 0.6), 0, 0]}
          color="#FF4400"
          intensity={0}
          distance={8}
        />

        {/* Impact particles */}
        <group
          ref={impactParticlesRef}
          position={[direction * (FIST_ARM_LENGTH * 0.5 + FIST_SIZE * 1.2), 0, 0]}
          visible={false}
        >
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const angle = (i / 8) * Math.PI * 2;
            return (
              <mesh
                key={`impact-${i}`}
                position={[
                  Math.cos(angle) * 0.8,
                  Math.sin(angle) * 0.8,
                  0,
                ]}
                material={materials.impact}
              >
                <sphereGeometry args={[0.15, 6, 4]} />
              </mesh>
            );
          })}
          {/* Central flash */}
          <mesh material={materials.impact}>
            <sphereGeometry args={[0.5, 8, 6]} />
          </mesh>
        </group>

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
