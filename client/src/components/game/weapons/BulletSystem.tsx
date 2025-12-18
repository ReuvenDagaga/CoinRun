// BulletSystem.tsx - Renders bullets and damage numbers
import { memo, useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { BulletData } from './types';

// Damage popup data
export interface DamagePopup {
  id: string;
  position: { x: number; y: number; z: number };
  damage: number;
  createdAt: number;
}

// Floating damage number component
const DamageNumber = memo(function DamageNumber({ popup }: { popup: DamagePopup }) {
  const groupRef = useRef<THREE.Group>(null);
  const startY = popup.position.y;

  useFrame(() => {
    if (!groupRef.current) return;

    const age = (Date.now() - popup.createdAt) / 1000; // Age in seconds
    const floatHeight = age * 2; // Float up 2 units per second
    const opacity = Math.max(0, 1 - age); // Fade out over 1 second

    groupRef.current.position.y = startY + floatHeight;

    // Update opacity through children
    groupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        (child.material as THREE.MeshBasicMaterial).opacity = opacity;
      }
    });
  });

  return (
    <group ref={groupRef} position={[popup.position.x, popup.position.y, popup.position.z]}>
      <Text
        fontSize={0.5}
        color="#FFD700"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        {popup.damage}
      </Text>
    </group>
  );
});

// Damage popups renderer
interface DamagePopupsProps {
  popups: DamagePopup[];
}

export const DamagePopups = memo(function DamagePopups({ popups }: DamagePopupsProps) {
  return (
    <group>
      {popups.map((popup) => (
        <DamageNumber key={popup.id} popup={popup} />
      ))}
    </group>
  );
});

// Simple visible bullet component - golden glowing bullets
// Renders directly at position from props - no useFrame needed
const SimpleBullet = memo(function SimpleBullet({ bullet }: { bullet: BulletData }) {
  return (
    <mesh position={[bullet.position.x, bullet.position.y, bullet.position.z]}>
      <sphereGeometry args={[0.15, 8, 6]} />
      <meshStandardMaterial
        color="#FFD700"
        emissive="#FFA500"
        emissiveIntensity={3}
      />
    </mesh>
  );
}, (prev, next) => {
  // Custom comparison - re-render if position changed significantly
  const dx = Math.abs(prev.bullet.position.x - next.bullet.position.x);
  const dy = Math.abs(prev.bullet.position.y - next.bullet.position.y);
  const dz = Math.abs(prev.bullet.position.z - next.bullet.position.z);
  // Don't re-render if position barely changed (optimization)
  return dx < 0.01 && dy < 0.01 && dz < 0.01;
});

interface BulletSystemProps {
  bullets: BulletData[];
}

// Simple bullet system - renders each bullet individually
export const BulletSystem = memo(function BulletSystem({ bullets }: BulletSystemProps) {
  if (bullets.length === 0) return null;

  return (
    <group name="bullet-system">
      {bullets.map((bullet) => (
        <SimpleBullet key={bullet.id} bullet={bullet} />
      ))}
    </group>
  );
});

// Instanced bullets for better performance with many bullets
interface InstancedBulletSystemProps {
  bullets: BulletData[];
}

export const InstancedBulletSystem = memo(function InstancedBulletSystem({
  bullets,
}: InstancedBulletSystemProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);

  // Debug log
  useEffect(() => {
    if (bullets.length > 0) {
      console.log(`InstancedBulletSystem: ${bullets.length} bullets, first at:`, bullets[0]?.position);
    }
  }, [bullets.length]);

  // Pre-allocate instance data
  const maxBullets = 500;

  useFrame(() => {
    if (!meshRef.current) return;

    // Update instance matrices
    bullets.forEach((bullet, i) => {
      if (i >= maxBullets) return;

      tempMatrix.makeTranslation(
        bullet.position.x,
        bullet.position.y,
        bullet.position.z
      );
      // Large bullets for visibility
      tempMatrix.scale(new THREE.Vector3(0.3, 0.3, 0.3));
      meshRef.current!.setMatrixAt(i, tempMatrix);
    });

    // Hide unused instances
    for (let i = bullets.length; i < maxBullets; i++) {
      tempMatrix.makeTranslation(0, -1000, 0); // Move far away
      tempMatrix.scale(new THREE.Vector3(0.001, 0.001, 0.001));
      meshRef.current!.setMatrixAt(i, tempMatrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#FFFF00',
      emissive: '#FFFF00',
      emissiveIntensity: 3,
    });
  }, []);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, maxBullets]}
      material={material}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 12, 8]} />
    </instancedMesh>
  );
});

export default BulletSystem;
