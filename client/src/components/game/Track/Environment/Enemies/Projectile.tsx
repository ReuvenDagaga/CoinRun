import { useRef, memo, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PROJECTILE_RADIUS } from '../types';

interface ProjectileProps {
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  onUpdate: (newPosition: { x: number; y: number; z: number }) => void;
}

export const Projectile = memo(function Projectile({
  position,
  velocity,
  onUpdate,
}: ProjectileProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const positionRef = useRef({ ...position });
  const glowRef = useRef<THREE.PointLight>(null);

  const materials = useMemo(() => ({
    core: new THREE.MeshStandardMaterial({
      color: '#FF00FF',
      emissive: '#FF00FF',
      emissiveIntensity: 2,
      roughness: 0.1,
      metalness: 0.5,
    }),
    outer: new THREE.MeshStandardMaterial({
      color: '#AA00AA',
      emissive: '#FF00FF',
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.6,
      roughness: 0.2,
    }),
  }), []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Update position based on velocity
    positionRef.current.x += velocity.x * delta;
    positionRef.current.y += velocity.y * delta;
    positionRef.current.z += velocity.z * delta;

    meshRef.current.position.set(
      positionRef.current.x,
      positionRef.current.y,
      positionRef.current.z
    );

    // Rotate for visual effect
    meshRef.current.rotation.x += delta * 5;
    meshRef.current.rotation.y += delta * 3;

    // Pulsing glow
    if (glowRef.current) {
      const pulse = 1.5 + Math.sin(state.clock.elapsedTime * 10) * 0.5;
      glowRef.current.intensity = pulse;
    }

    // Notify parent of position update
    onUpdate(positionRef.current);
  });

  return (
    <group position={[position.x, position.y, position.z]}>
      <mesh ref={meshRef}>
        {/* Core sphere */}
        <mesh material={materials.core}>
          <sphereGeometry args={[PROJECTILE_RADIUS, 12, 8]} />
        </mesh>

        {/* Outer glow sphere */}
        <mesh material={materials.outer}>
          <sphereGeometry args={[PROJECTILE_RADIUS * 1.5, 8, 6]} />
        </mesh>

        {/* Trail effect using multiple smaller spheres */}
        {[-0.3, -0.6, -0.9].map((offset, i) => (
          <mesh
            key={i}
            position={[
              -velocity.x * 0.05 * (i + 1),
              -velocity.y * 0.05 * (i + 1),
              -velocity.z * 0.05 * (i + 1),
            ]}
            material={materials.outer}
          >
            <sphereGeometry args={[PROJECTILE_RADIUS * (0.8 - i * 0.2), 6, 4]} />
          </mesh>
        ))}
      </mesh>

      {/* Point light for glow effect */}
      <pointLight
        ref={glowRef}
        color="#FF00FF"
        intensity={1.5}
        distance={5}
      />
    </group>
  );
});

export default Projectile;
