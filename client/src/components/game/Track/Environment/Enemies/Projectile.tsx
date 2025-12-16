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
  const trailRef = useRef<THREE.Group>(null);

  // Use bright, contrasting colors for visibility
  const materials = useMemo(() => ({
    // Bright cyan core for maximum visibility
    core: new THREE.MeshStandardMaterial({
      color: '#00FFFF',
      emissive: '#00FFFF',
      emissiveIntensity: 4,
      roughness: 0.0,
      metalness: 0.8,
    }),
    // Bright yellow-white outer glow
    outer: new THREE.MeshStandardMaterial({
      color: '#FFFF00',
      emissive: '#FFFF00',
      emissiveIntensity: 3,
      transparent: true,
      opacity: 0.7,
      roughness: 0.0,
    }),
    // Trail particles
    trail: new THREE.MeshStandardMaterial({
      color: '#FF6600',
      emissive: '#FF6600',
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.6,
      roughness: 0.1,
    }),
    // Spark particles
    spark: new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      emissive: '#FFFFFF',
      emissiveIntensity: 5,
      transparent: true,
      opacity: 0.9,
      roughness: 0.0,
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
    meshRef.current.rotation.x += delta * 8;
    meshRef.current.rotation.y += delta * 6;

    // Pulsing glow - more dramatic pulsing
    if (glowRef.current) {
      const pulse = 4 + Math.sin(state.clock.elapsedTime * 15) * 2;
      glowRef.current.intensity = pulse;
    }

    // Animate trail
    if (trailRef.current) {
      trailRef.current.rotation.z += delta * 10;
    }

    // Notify parent of position update
    onUpdate(positionRef.current);
  });

  return (
    <group position={[position.x, position.y, position.z]}>
      <mesh ref={meshRef}>
        {/* Core sphere - large and bright */}
        <mesh material={materials.core}>
          <sphereGeometry args={[PROJECTILE_RADIUS, 16, 12]} />
        </mesh>

        {/* Inner glow sphere */}
        <mesh material={materials.outer}>
          <sphereGeometry args={[PROJECTILE_RADIUS * 1.3, 12, 10]} />
        </mesh>

        {/* Outer energy field */}
        <mesh material={materials.outer}>
          <sphereGeometry args={[PROJECTILE_RADIUS * 1.8, 10, 8]} />
        </mesh>

        {/* Rotating ring effect */}
        <group ref={trailRef}>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.spark}>
            <torusGeometry args={[PROJECTILE_RADIUS * 1.4, 0.08, 6, 16]} />
          </mesh>
          <mesh rotation={[Math.PI / 3, Math.PI / 4, 0]} material={materials.spark}>
            <torusGeometry args={[PROJECTILE_RADIUS * 1.2, 0.06, 6, 12]} />
          </mesh>
        </group>

        {/* Extended trail effect - multiple larger spheres */}
        {[0.15, 0.3, 0.5, 0.75, 1.0].map((offset, i) => (
          <mesh
            key={i}
            position={[
              -velocity.x * offset * 0.08,
              -velocity.y * offset * 0.08,
              -velocity.z * offset * 0.08,
            ]}
            material={materials.trail}
          >
            <sphereGeometry args={[PROJECTILE_RADIUS * (0.9 - i * 0.15), 8, 6]} />
          </mesh>
        ))}

        {/* Spark particles around projectile */}
        {[0, 1, 2, 3].map((i) => (
          <mesh
            key={`spark-${i}`}
            position={[
              Math.cos(i * Math.PI / 2) * PROJECTILE_RADIUS * 1.6,
              Math.sin(i * Math.PI / 2) * PROJECTILE_RADIUS * 1.6,
              0,
            ]}
            material={materials.spark}
          >
            <sphereGeometry args={[0.1, 4, 4]} />
          </mesh>
        ))}
      </mesh>

      {/* Strong point light for illumination */}
      <pointLight
        ref={glowRef}
        color="#00FFFF"
        intensity={4}
        distance={15}
      />

      {/* Secondary warm light for contrast */}
      <pointLight
        color="#FFFF00"
        intensity={2}
        distance={8}
      />
    </group>
  );
});

export default Projectile;
