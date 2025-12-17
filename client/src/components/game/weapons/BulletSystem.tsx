// BulletSystem.tsx - Renders and manages bullets in the game
import { memo, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BulletData } from './types';

interface BulletProps {
  bullet: BulletData;
}

// Individual bullet component
const Bullet = memo(function Bullet({ bullet }: BulletProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: bullet.color,
      emissive: bullet.color,
      emissiveIntensity: 2,
      metalness: 0.5,
      roughness: 0.3,
    });
  }, [bullet.color]);

  return (
    <mesh
      ref={meshRef}
      position={[bullet.position.x, bullet.position.y, bullet.position.z]}
      material={material}
    >
      <sphereGeometry args={[bullet.size, 8, 6]} />
    </mesh>
  );
});

interface BulletSystemProps {
  bullets: BulletData[];
}

// Bullet system renderer
export const BulletSystem = memo(function BulletSystem({ bullets }: BulletSystemProps) {
  if (bullets.length === 0) return null;

  return (
    <group>
      {bullets.map((bullet) => (
        <Bullet key={bullet.id} bullet={bullet} />
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
  const tempColor = useMemo(() => new THREE.Color(), []);

  // Pre-allocate instance data
  const maxBullets = 500;

  useFrame(() => {
    if (!meshRef.current) return;

    // Update instance matrices and colors
    bullets.forEach((bullet, i) => {
      if (i >= maxBullets) return;

      tempMatrix.makeTranslation(
        bullet.position.x,
        bullet.position.y,
        bullet.position.z
      );
      // Make bullets larger for visibility (min 0.15 radius)
      const bulletScale = Math.max(bullet.size * 2, 0.15);
      tempMatrix.scale(new THREE.Vector3(bulletScale, bulletScale, bulletScale));
      meshRef.current!.setMatrixAt(i, tempMatrix);

      tempColor.set(bullet.color);
      meshRef.current!.setColorAt(i, tempColor);
    });

    // Hide unused instances
    for (let i = bullets.length; i < maxBullets; i++) {
      tempMatrix.makeScale(0, 0, 0);
      meshRef.current!.setMatrixAt(i, tempMatrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#FFD700',
      emissive: '#FFD700',
      emissiveIntensity: 2,
      metalness: 0.5,
      roughness: 0.3,
    });
  }, []);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, maxBullets]} material={material}>
      <sphereGeometry args={[1, 8, 6]} />
    </instancedMesh>
  );
});

// Muzzle flash component
interface MuzzleFlashProps {
  position: { x: number; y: number; z: number };
  color: string;
  visible: boolean;
}

export const MuzzleFlash = memo(function MuzzleFlash({
  position,
  color,
  visible,
}: MuzzleFlashProps) {
  if (!visible) return null;

  return (
    <group position={[position.x, position.y, position.z]}>
      <pointLight color={color} intensity={3} distance={2} decay={2} />
      <mesh>
        <sphereGeometry args={[0.05, 8, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>
    </group>
  );
});

export default BulletSystem;
