import { memo, useMemo } from 'react';
import * as THREE from 'three';
import { BOULDER_CONFIG } from '../types';
import { GROUND_Y } from '../../../Player';

interface EnemyBoulderProps {
  radius: number;
  rotationY: number;
}

export const EnemyBoulder = memo(function EnemyBoulder({
  radius,
  rotationY,
}: EnemyBoulderProps) {
  // Materials
  const materials = useMemo(() => ({
    primary: new THREE.MeshStandardMaterial({
      color: BOULDER_CONFIG.primaryColor,
      roughness: 0.9,
      metalness: 0.1,
    }),
    secondary: new THREE.MeshStandardMaterial({
      color: BOULDER_CONFIG.secondaryColor,
      roughness: 0.95,
      metalness: 0.05,
    }),
    accent: new THREE.MeshStandardMaterial({
      color: BOULDER_CONFIG.accentColor,
      roughness: 0.85,
      metalness: 0.1,
    }),
  }), []);

  // Create varied boulder shape using multiple spheres
  const boulderHeight = GROUND_Y + radius * 0.9;

  return (
    <group position={[0, boulderHeight, 0]} rotation={[0, rotationY, 0]}>
      {/* Main boulder body - slightly flattened */}
      <mesh material={materials.primary} castShadow receiveShadow>
        <sphereGeometry args={[radius, 12, 10]} />
      </mesh>

      {/* Irregular lumps for natural look */}
      <mesh
        position={[radius * 0.4, radius * 0.3, radius * 0.2]}
        material={materials.secondary}
        castShadow
      >
        <sphereGeometry args={[radius * 0.4, 8, 6]} />
      </mesh>

      <mesh
        position={[-radius * 0.3, radius * 0.2, -radius * 0.4]}
        material={materials.secondary}
        castShadow
      >
        <sphereGeometry args={[radius * 0.35, 8, 6]} />
      </mesh>

      <mesh
        position={[radius * 0.2, -radius * 0.3, radius * 0.3]}
        material={materials.accent}
        castShadow
      >
        <sphereGeometry args={[radius * 0.3, 8, 6]} />
      </mesh>

      <mesh
        position={[-radius * 0.4, -radius * 0.1, radius * 0.3]}
        material={materials.accent}
        castShadow
      >
        <sphereGeometry args={[radius * 0.25, 8, 6]} />
      </mesh>

      {/* Flat bottom for stability look */}
      <mesh
        position={[0, -radius * 0.7, 0]}
        material={materials.secondary}
        receiveShadow
      >
        <cylinderGeometry args={[radius * 0.8, radius * 0.9, radius * 0.3, 12]} />
      </mesh>

      {/* Cracks/details - using thin boxes */}
      <mesh
        position={[radius * 0.5, 0, 0]}
        rotation={[0, 0, Math.PI / 6]}
        material={materials.secondary}
      >
        <boxGeometry args={[0.05, radius * 0.6, 0.02]} />
      </mesh>

      <mesh
        position={[-radius * 0.3, radius * 0.2, radius * 0.4]}
        rotation={[Math.PI / 4, 0, Math.PI / 3]}
        material={materials.secondary}
      >
        <boxGeometry args={[0.04, radius * 0.4, 0.02]} />
      </mesh>
    </group>
  );
});

export default EnemyBoulder;
