// WeaponModel.tsx - Procedural weapon models for soldiers
import { memo, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { WeaponTier, WEAPON_CONFIGS } from './types';

interface WeaponModelProps {
  tier: WeaponTier;
  scale?: number;
}

// Procedural Pistol Model - Larger and more visible
const ProceduralPistol = memo(function ProceduralPistol({ scale = 1 }: { scale: number }) {
  const materials = useMemo(() => ({
    body: new THREE.MeshStandardMaterial({
      color: '#3a3a3a',
      metalness: 0.8,
      roughness: 0.3,
    }),
    grip: new THREE.MeshStandardMaterial({
      color: '#5a4738',
      metalness: 0.2,
      roughness: 0.8,
    }),
    barrel: new THREE.MeshStandardMaterial({
      color: '#2a2a2a',
      metalness: 0.9,
      roughness: 0.2,
    }),
    accent: new THREE.MeshStandardMaterial({
      color: '#d0d0d0',
      metalness: 0.95,
      roughness: 0.1,
    }),
  }), []);

  return (
    <group scale={scale}>
      {/* Main body/slide - more visible */}
      <mesh material={materials.body} position={[0, 0, 0.08]} castShadow>
        <boxGeometry args={[0.06, 0.08, 0.28]} />
      </mesh>

      {/* Barrel - rotated correctly and extended */}
      <mesh position={[0, 0, 0.28]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.022, 0.12, 8]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Muzzle */}
      <mesh position={[0, 0, 0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.018, 0.02, 8]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.95} roughness={0.1} />
      </mesh>

      {/* Front sight */}
      <mesh material={materials.accent} position={[0, 0.055, 0.18]} castShadow>
        <boxGeometry args={[0.015, 0.025, 0.015]} />
      </mesh>

      {/* Rear sight */}
      <mesh material={materials.accent} position={[0, 0.055, -0.02]} castShadow>
        <boxGeometry args={[0.05, 0.02, 0.015]} />
      </mesh>

      {/* Grip - angled back */}
      <mesh material={materials.grip} position={[0, -0.08, -0.04]} rotation={[0.25, 0, 0]} castShadow>
        <boxGeometry args={[0.05, 0.14, 0.06]} />
      </mesh>

      {/* Trigger guard */}
      <mesh material={materials.body} position={[0, -0.03, 0.04]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.022, 0.006, 6, 8, Math.PI]} />
      </mesh>

      {/* Trigger */}
      <mesh material={materials.accent} position={[0, -0.025, 0.04]}>
        <boxGeometry args={[0.012, 0.025, 0.008]} />
      </mesh>

      {/* Magazine base */}
      <mesh material={materials.body} position={[0, -0.16, -0.04]} castShadow>
        <boxGeometry args={[0.04, 0.04, 0.05]} />
      </mesh>

      {/* Slide serrations - visual detail */}
      {[-0.04, 0, 0.04].map((zOff, i) => (
        <mesh key={i} material={materials.accent} position={[0.032, 0, zOff]}>
          <boxGeometry args={[0.003, 0.06, 0.015]} />
        </mesh>
      ))}
    </group>
  );
});

// GLB Loader component with fallback
const GLBWeaponModel = memo(function GLBWeaponModel({
  modelPath,
  scale
}: {
  modelPath: string;
  scale: number;
}) {
  try {
    const { scene } = useGLTF(modelPath);
    const clonedScene = useMemo(() => {
      const clone = scene.clone();
      clone.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
        }
      });
      return clone;
    }, [scene]);

    return <primitive object={clonedScene} scale={scale} />;
  } catch {
    // Fallback to procedural if GLB fails to load
    return <ProceduralPistol scale={scale} />;
  }
});

// Main WeaponModel component
export const WeaponModel = memo(function WeaponModel({ tier, scale }: WeaponModelProps) {
  const config = WEAPON_CONFIGS[tier];
  // Use larger default scale for visibility
  const finalScale = scale || config.scale * 2.5;

  // For now, all tiers use the procedural pistol since only tier 1 is implemented
  // Future tiers will have their own models
  return <ProceduralPistol scale={finalScale} />;
});

// Preload pistol model if available
try {
  useGLTF.preload('/models/weapons/pistol.glb');
} catch {
  // Silent fail - will use procedural model
}

export default WeaponModel;
