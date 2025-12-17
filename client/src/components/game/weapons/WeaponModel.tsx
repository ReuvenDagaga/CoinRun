// WeaponModel.tsx - Procedural weapon models for soldiers
import { memo, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { WeaponTier, WEAPON_CONFIGS } from './types';

interface WeaponModelProps {
  tier: WeaponTier;
  scale?: number;
}

// Procedural Pistol Model
const ProceduralPistol = memo(function ProceduralPistol({ scale = 1 }: { scale: number }) {
  const materials = useMemo(() => ({
    body: new THREE.MeshStandardMaterial({
      color: '#2a2a2a',
      metalness: 0.8,
      roughness: 0.3,
    }),
    grip: new THREE.MeshStandardMaterial({
      color: '#4a3728',
      metalness: 0.2,
      roughness: 0.8,
    }),
    barrel: new THREE.MeshStandardMaterial({
      color: '#1a1a1a',
      metalness: 0.9,
      roughness: 0.2,
    }),
    accent: new THREE.MeshStandardMaterial({
      color: '#c0c0c0',
      metalness: 0.95,
      roughness: 0.1,
    }),
  }), []);

  return (
    <group scale={scale} rotation={[0, Math.PI / 2, 0]}>
      {/* Main body/slide */}
      <mesh material={materials.body} position={[0, 0.03, 0.12]}>
        <boxGeometry args={[0.08, 0.06, 0.35]} />
      </mesh>

      {/* Barrel */}
      <mesh material={materials.barrel} position={[0, 0.03, 0.35]}>
        <cylinderGeometry args={[0.015, 0.02, 0.15, 8]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Front sight */}
      <mesh material={materials.accent} position={[0, 0.07, 0.25]}>
        <boxGeometry args={[0.02, 0.02, 0.02]} />
      </mesh>

      {/* Rear sight */}
      <mesh material={materials.accent} position={[0, 0.07, -0.02]}>
        <boxGeometry args={[0.06, 0.02, 0.02]} />
      </mesh>

      {/* Grip */}
      <mesh material={materials.grip} position={[0, -0.08, -0.05]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.06, 0.18, 0.08]} />
      </mesh>

      {/* Trigger guard */}
      <mesh material={materials.body} position={[0, -0.02, 0.05]}>
        <torusGeometry args={[0.025, 0.008, 8, 8, Math.PI]} />
      </mesh>

      {/* Trigger */}
      <mesh material={materials.accent} position={[0, -0.02, 0.05]}>
        <boxGeometry args={[0.015, 0.03, 0.01]} />
      </mesh>

      {/* Magazine */}
      <mesh material={materials.body} position={[0, -0.15, -0.05]}>
        <boxGeometry args={[0.05, 0.06, 0.06]} />
      </mesh>
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
  const finalScale = scale || config.scale;

  // For now, all tiers use the procedural pistol since only tier 1 is implemented
  // Future tiers will have their own models
  if (tier === 1) {
    // Try to load GLB, fallback to procedural
    return (
      <Suspense fallback={<ProceduralPistol scale={finalScale} />}>
        <ProceduralPistol scale={finalScale} />
      </Suspense>
    );
  }

  // For future tiers (2-10), use procedural pistol as placeholder
  return <ProceduralPistol scale={finalScale} />;
});

// Preload pistol model if available
try {
  useGLTF.preload('/models/weapons/pistol.glb');
} catch {
  // Silent fail - will use procedural model
}

export default WeaponModel;
