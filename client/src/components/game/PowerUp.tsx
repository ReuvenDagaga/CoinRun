import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GateType } from '@shared/types/game.types';
import { useGameStore } from '@/store/gameStore';
import { COLORS } from '@/utils/constants';

// Visual effects for active power-ups
export function PowerUpEffects() {
  const { activePowerUps, player } = useGameStore();

  return (
    <group position={[player.position.x, player.position.y, player.position.z]}>
      {activePowerUps.map((powerUp) => (
        <PowerUpEffect key={powerUp.type} type={powerUp.type} />
      ))}
    </group>
  );
}

interface PowerUpEffectProps {
  type: GateType;
}

function PowerUpEffect({ type }: PowerUpEffectProps) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    meshRef.current.rotation.y = time * 2;
  });

  switch (type) {
    case GateType.SPEED:
      return <SpeedEffect />;
    case GateType.SHIELD:
      return <ShieldEffect />;
    case GateType.MAGNET:
      return <MagnetEffect />;
    case GateType.BULLETS:
      return <BulletsEffect />;
    default:
      return null;
  }
}

function SpeedEffect() {
  const particlesRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (!particlesRef.current) return;
    const time = state.clock.elapsedTime;

    // Animate particles
    const positions = particlesRef.current.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      positions.setY(i, ((y + time * 5) % 3) - 1.5);
    }
    positions.needsUpdate = true;
  });

  // Generate trailing particles
  const particles = new Float32Array(30 * 3);
  for (let i = 0; i < 30; i++) {
    particles[i * 3] = (Math.random() - 0.5) * 1;
    particles[i * 3 + 1] = Math.random() * 3 - 1.5;
    particles[i * 3 + 2] = -Math.random() * 3;
  }

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={30}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={COLORS.GATE_SPEED}
        size={0.2}
        transparent
        opacity={0.6}
      />
    </points>
  );
}

function ShieldEffect() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;

    // Pulsing effect
    const scale = 1 + Math.sin(time * 3) * 0.1;
    meshRef.current.scale.setScalar(scale);

    // Rotate
    meshRef.current.rotation.y = time;
    meshRef.current.rotation.z = time * 0.5;
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color={COLORS.GATE_SHIELD}
        emissive={COLORS.GATE_SHIELD}
        emissiveIntensity={0.5}
        transparent
        opacity={0.3}
        wireframe
      />
    </mesh>
  );
}

function MagnetEffect() {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ringRef.current) return;
    const time = state.clock.elapsedTime;

    // Expand and contract
    const scale = 2 + Math.sin(time * 4) * 0.5;
    ringRef.current.scale.set(scale, scale, 1);

    // Fade based on scale
    const material = ringRef.current.material as THREE.MeshBasicMaterial;
    material.opacity = 0.5 - (scale - 2) * 0.3;
  });

  return (
    <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
      <ringGeometry args={[0.8, 1, 32]} />
      <meshBasicMaterial
        color={COLORS.GATE_MAGNET}
        transparent
        opacity={0.5}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function BulletsEffect() {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    meshRef.current.rotation.y = time * 2;
  });

  return (
    <group ref={meshRef}>
      {/* Targeting reticle */}
      <mesh position={[0, 1.5, 1]}>
        <ringGeometry args={[0.2, 0.25, 32]} />
        <meshBasicMaterial color={COLORS.GATE_BULLETS} transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, 1.5, 1]}>
        <ringGeometry args={[0.1, 0.12, 32]} />
        <meshBasicMaterial color={COLORS.GATE_BULLETS} transparent opacity={0.8} />
      </mesh>
      {/* Crosshairs */}
      <mesh position={[0, 1.5, 1]}>
        <planeGeometry args={[0.02, 0.5]} />
        <meshBasicMaterial color={COLORS.GATE_BULLETS} />
      </mesh>
      <mesh position={[0, 1.5, 1]} rotation={[0, 0, Math.PI / 2]}>
        <planeGeometry args={[0.02, 0.5]} />
        <meshBasicMaterial color={COLORS.GATE_BULLETS} />
      </mesh>
    </group>
  );
}

// Bullet projectile
interface BulletProps {
  startPosition: THREE.Vector3;
  targetPosition: THREE.Vector3;
  onHit: () => void;
}

export function Bullet({ startPosition, targetPosition, onHit }: BulletProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const progress = useRef(0);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    progress.current += delta * 3; // Speed

    if (progress.current >= 1) {
      onHit();
      return;
    }

    // Lerp position
    meshRef.current.position.lerpVectors(startPosition, targetPosition, progress.current);

    // Trail effect
    meshRef.current.scale.z = 1 + progress.current * 2;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshBasicMaterial color={COLORS.GATE_BULLETS} />
    </mesh>
  );
}
