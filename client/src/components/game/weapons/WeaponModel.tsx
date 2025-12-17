// WeaponModel.tsx - Procedural weapon models for soldiers
import { memo, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { WeaponTier, WEAPON_CONFIGS } from './types';

interface WeaponModelProps {
  tier: WeaponTier;
  scale?: number;
}

// Procedural Pistol Model - DEBUG: Made bright red and large for visibility
const ProceduralPistol = memo(function ProceduralPistol({ scale = 1 }: { scale: number }) {
  // DEBUG: Bright red material to spot the weapon
  const debugMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#FF0000',
    emissive: '#FF0000',
    emissiveIntensity: 0.5,
    metalness: 0.3,
    roughness: 0.5,
  }), []);

  return (
    <group scale={scale * 3}> {/* DEBUG: 3x larger */}
      {/* Simple box to debug visibility */}
      <mesh material={debugMaterial} castShadow>
        <boxGeometry args={[0.15, 0.1, 0.4]} />
      </mesh>
      {/* Barrel */}
      <mesh material={debugMaterial} position={[0, 0.02, 0.25]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.15, 8]} />
      </mesh>
      {/* Grip */}
      <mesh material={debugMaterial} position={[0, -0.12, -0.05]} rotation={[0.2, 0, 0]} castShadow>
        <boxGeometry args={[0.08, 0.18, 0.08]} />
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
