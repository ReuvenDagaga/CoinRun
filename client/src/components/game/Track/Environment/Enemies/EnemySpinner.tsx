import { useRef, memo, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  ENEMY_CONFIG,
  ENEMY_POLE_HEIGHT,
  ENEMY_POLE_RADIUS,
  ENEMY_SPIKE_LENGTH,
  ENEMY_SPIKE_RADIUS,
  ENEMY_BASE_RADIUS,
  ENEMY_BASE_HEIGHT,
} from '../types';
import { GROUND_Y } from '../../../Player';

interface EnemySpinnerProps {
  rotationSpeed: number; // Rotations per second
}

// Creates a single spike arm (cone + cylinder)
const SpikeArm = memo(function SpikeArm({
  rotation,
  materials,
}: {
  rotation: number;
  materials: { spike: THREE.MeshStandardMaterial };
}) {
  return (
    <group rotation={[0, rotation, 0]}>
      {/* Spike arm - cylinder extending outward */}
      <mesh
        position={[ENEMY_SPIKE_LENGTH / 2, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        material={materials.spike}
        castShadow
      >
        <cylinderGeometry args={[ENEMY_SPIKE_RADIUS, ENEMY_SPIKE_RADIUS * 0.5, ENEMY_SPIKE_LENGTH, 8]} />
      </mesh>
      {/* Spike tip - cone at end */}
      <mesh
        position={[ENEMY_SPIKE_LENGTH + 0.15, 0, 0]}
        rotation={[0, 0, -Math.PI / 2]}
        material={materials.spike}
        castShadow
      >
        <coneGeometry args={[ENEMY_SPIKE_RADIUS * 1.5, 0.3, 8]} />
      </mesh>
    </group>
  );
});

// Creates a tier of 4 spikes at a given height
const SpikeTier = memo(function SpikeTier({
  height,
  rotationOffset,
  materials,
}: {
  height: number;
  rotationOffset: number;
  materials: { spike: THREE.MeshStandardMaterial };
}) {
  return (
    <group position={[0, height, 0]}>
      {/* 4 spikes per tier, evenly distributed */}
      {[0, 1, 2, 3].map((i) => (
        <SpikeArm
          key={i}
          rotation={rotationOffset + (Math.PI / 2) * i}
          materials={materials}
        />
      ))}
    </group>
  );
});

// The main spinning spike component
export const EnemySpinner = memo(function EnemySpinner({
  rotationSpeed,
}: EnemySpinnerProps) {
  const spinnerRef = useRef<THREE.Group>(null);

  // Create materials once
  const materials = useMemo(() => {
    return {
      base: new THREE.MeshStandardMaterial({
        color: ENEMY_CONFIG.baseColor,
        roughness: 0.8,
        metalness: 0.2,
      }),
      pole: new THREE.MeshStandardMaterial({
        color: ENEMY_CONFIG.poleColor,
        roughness: 0.7,
        metalness: 0.1,
      }),
      spike: new THREE.MeshStandardMaterial({
        color: ENEMY_CONFIG.spikeColor,
        roughness: 0.3,
        metalness: 0.8,
        emissive: new THREE.Color('#1a1a1a'),
        emissiveIntensity: 0.2,
      }),
      metal: new THREE.MeshStandardMaterial({
        color: ENEMY_CONFIG.metalColor,
        roughness: 0.2,
        metalness: 0.9,
      }),
    };
  }, []);

  // Rotate the spinner continuously
  useFrame((_, delta) => {
    if (spinnerRef.current) {
      spinnerRef.current.rotation.y += rotationSpeed * Math.PI * 2 * delta;
    }
  });

  // Height positions for spike tiers (3 tiers)
  const tierHeights = [0.8, 1.6, 2.4];
  // Alternate rotation offsets for visual variety
  const tierRotationOffsets = [0, Math.PI / 4, 0];

  return (
    <group position={[0, GROUND_Y, 0]}>
      {/* Decorative base platform */}
      <mesh position={[0, ENEMY_BASE_HEIGHT / 2, 0]} material={materials.base} receiveShadow>
        <cylinderGeometry args={[ENEMY_BASE_RADIUS, ENEMY_BASE_RADIUS * 1.2, ENEMY_BASE_HEIGHT, 16]} />
      </mesh>

      {/* Metal ring on base */}
      <mesh position={[0, ENEMY_BASE_HEIGHT, 0]} material={materials.metal}>
        <torusGeometry args={[ENEMY_BASE_RADIUS * 0.8, 0.05, 8, 16]} />
      </mesh>

      {/* Central wooden pole */}
      <mesh
        position={[0, ENEMY_POLE_HEIGHT / 2 + ENEMY_BASE_HEIGHT, 0]}
        material={materials.pole}
        castShadow
      >
        <cylinderGeometry args={[ENEMY_POLE_RADIUS, ENEMY_POLE_RADIUS * 1.1, ENEMY_POLE_HEIGHT, 12]} />
      </mesh>

      {/* Metal bands on pole */}
      {[0.5, 1.2, 2.0, 2.8].map((h, i) => (
        <mesh key={i} position={[0, h + ENEMY_BASE_HEIGHT, 0]} material={materials.metal}>
          <torusGeometry args={[ENEMY_POLE_RADIUS * 1.3, 0.03, 8, 12]} />
        </mesh>
      ))}

      {/* Pole cap */}
      <mesh
        position={[0, ENEMY_POLE_HEIGHT + ENEMY_BASE_HEIGHT + 0.1, 0]}
        material={materials.metal}
        castShadow
      >
        <sphereGeometry args={[ENEMY_POLE_RADIUS * 1.5, 12, 8]} />
      </mesh>

      {/* Spinning spike section */}
      <group ref={spinnerRef} position={[0, ENEMY_BASE_HEIGHT, 0]}>
        {tierHeights.map((height, i) => (
          <SpikeTier
            key={i}
            height={height}
            rotationOffset={tierRotationOffsets[i]}
            materials={{ spike: materials.spike }}
          />
        ))}
      </group>
    </group>
  );
});

export default EnemySpinner;
