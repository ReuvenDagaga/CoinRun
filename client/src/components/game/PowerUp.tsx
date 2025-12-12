// @ts-nocheck
// Legacy PowerUp component - not used in simplified core version
import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GateType, GAME_CONSTANTS, getBulletDamage } from '@shared/types/game.types';
import { useGame, useUser } from '@/context';
import { COLORS } from '@/utils/constants';
import { playerPath } from './Player';

// Bullet interface
interface BulletData {
  id: string;
  position: THREE.Vector3;
  startPosition: THREE.Vector3;
  active: boolean;
  spawnTime: number;
}

// Global bullet pool for performance
const MAX_BULLETS = 150; // Reduced for better performance
const bulletPool: BulletData[] = [];
const activeBulletIndices: Set<number> = new Set(); // Track active bullets for faster iteration

for (let i = 0; i < MAX_BULLETS; i++) {
  bulletPool.push({
    id: `bullet-${i}`,
    position: new THREE.Vector3(),
    startPosition: new THREE.Vector3(),
    active: false,
    spawnTime: 0
  });
}

// Visual effects for active power-ups
export function PowerUpEffects() {
  const { activePowerUps, player } = useGame();

  return (
    <group position={[player.position.x, player.position.y, player.position.z]}>
      {activePowerUps.map((powerUp) => (
        <PowerUpEffect key={powerUp.type} type={powerUp.type as GateType} />
      ))}
    </group>
  );
}

// Bullet System - Continuous shooting from all soldiers
export function BulletSystem() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { player, status, activePowerUps, killEnemy } = useGame();
  const { userData } = useUser();
  const user = userData;

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Track soldier fire timers
  const soldierTimers = useRef<number[]>([]);
  const bulletPower = user?.upgrades.bulletPower || 0;
  const hasBulletsBoost = activePowerUps.some(p => p.type === GateType.BULLETS);

  // Initialize soldier timers with staggered offsets
  useEffect(() => {
    soldierTimers.current = [];
    for (let i = 0; i < 130; i++) {
      // Stagger fire times so soldiers don't all fire at once
      soldierTimers.current.push(Math.random());
    }
  }, []);

  // Get soldier positions from the path system
  const getSoldierPosition = (index: number): THREE.Vector3 | null => {
    const delay = (index + 1) * GAME_CONSTANTS.SOLDIER_FOLLOW_DELAY;
    const targetTime = Date.now() - delay;

    if (playerPath.length === 0) {
      return new THREE.Vector3(
        player.position.x,
        0.5,
        player.position.z - (index + 1) * GAME_CONSTANTS.SOLDIER_SPACING
      );
    }

    // Find position in path
    let low = 0;
    let high = playerPath.length - 1;

    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (playerPath[mid].timestamp < targetTime) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    const point = playerPath[low] || playerPath[playerPath.length - 1];
    return point ? new THREE.Vector3(point.position.x, 0.5, point.position.z) : null;
  };

  useFrame((state, delta) => {
    if (!meshRef.current || status !== 'playing') return;

    const armyCount = Math.max(1, player.armyCount);
    const now = Date.now();
    const bulletSpeed = GAME_CONSTANTS.BULLET_SPEED;

    // Fire bullets from soldiers (all soldiers shoot continuously)
    // Limit soldiers firing to reduce bullet count
    const maxFiringSoldiers = Math.min(armyCount, 50);
    for (let i = 0; i < maxFiringSoldiers; i++) {
      soldierTimers.current[i] = (soldierTimers.current[i] || 0) + delta;

      // Fire rate: 1 bullet per second (staggered)
      if (soldierTimers.current[i] >= GAME_CONSTANTS.BULLET_FIRE_RATE) {
        soldierTimers.current[i] = 0;

        // Get soldier position
        const soldierPos = getSoldierPosition(i);
        if (!soldierPos) continue;

        // Find inactive bullet from pool - start from a random position to spread allocation
        let bulletIndex = -1;
        for (let j = 0; j < MAX_BULLETS; j++) {
          if (!bulletPool[j].active) {
            bulletIndex = j;
            break;
          }
        }

        if (bulletIndex >= 0) {
          const bullet = bulletPool[bulletIndex];
          bullet.active = true;
          bullet.spawnTime = now;
          bullet.startPosition.copy(soldierPos);
          bullet.position.copy(soldierPos);
          activeBulletIndices.add(bulletIndex);
        }
      }
    }

    // Update only active bullets (much faster than iterating all)
    const toRemove: number[] = [];

    activeBulletIndices.forEach(i => {
      const bullet = bulletPool[i];

      // Move bullet forward
      bullet.position.z += bulletSpeed * delta;

      // Check if bullet traveled too far (120m for performance)
      const traveledDistance = bullet.position.z - bullet.startPosition.z;
      if (traveledDistance > 120) {
        bullet.active = false;
        toRemove.push(i);
        dummy.scale.setScalar(0);
      } else {
        dummy.position.copy(bullet.position);
        dummy.scale.setScalar(1);
      }

      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    // Remove deactivated bullets from tracking
    toRemove.forEach(i => activeBulletIndices.delete(i));

    // Update inactive bullets matrices only occasionally (every 10 frames or so)
    if (Math.random() < 0.1) {
      for (let i = 0; i < MAX_BULLETS; i++) {
        if (!bulletPool[i].active && !activeBulletIndices.has(i)) {
          dummy.scale.setScalar(0);
          dummy.position.set(0, -100, 0);
          dummy.updateMatrix();
          meshRef.current.setMatrixAt(i, dummy.matrix);
        }
      }
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  // Bullet color based on power-up
  const bulletColor = hasBulletsBoost ? '#ff4444' : '#ffffff';
  const bulletEmissive = hasBulletsBoost ? '#ff0000' : '#ffaa00';

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_BULLETS]}>
      <sphereGeometry args={[0.08, 6, 6]} />
      <meshStandardMaterial
        color={bulletColor}
        emissive={bulletEmissive}
        emissiveIntensity={0.8}
      />
    </instancedMesh>
  );
}

// Export bullet pool for enemy collision detection - optimized
export function getActiveBullets(): BulletData[] {
  const result: BulletData[] = [];
  activeBulletIndices.forEach(i => {
    if (bulletPool[i].active) {
      result.push(bulletPool[i]);
    }
  });
  return result;
}

export function deactivateBullet(id: string) {
  const index = parseInt(id.split('-')[1]);
  if (index >= 0 && index < MAX_BULLETS) {
    bulletPool[index].active = false;
    activeBulletIndices.delete(index);
  }
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
