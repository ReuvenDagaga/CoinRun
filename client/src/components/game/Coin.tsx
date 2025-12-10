import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import type { CoinState } from '@shared/types/game.types';
import { COLORS } from '@/utils/constants';
import { useGameStore } from '@/store/gameStore';
import { GateType, getMagnetRadius } from '@shared/types/game.types';
import { useUserStore } from '@/store/userStore';

interface CoinProps {
  coin: CoinState;
  onCollect: (coin: CoinState) => void;
}

export default function Coin({ coin, onCollect }: CoinProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isCollected, setIsCollected] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const { player, activePowerUps } = useGameStore();
  const user = useUserStore((state) => state.user);

  // Check for magnet power-up
  const hasMagnet = activePowerUps.some(p => p.type === GateType.MAGNET);
  const magnetLevel = user?.upgrades.magnetRadius || 0;
  const magnetRadius = getMagnetRadius(magnetLevel);

  // Animation
  useFrame((state, delta) => {
    if (!meshRef.current || isCollected) return;

    // Rotate
    meshRef.current.rotation.y += delta * 3;

    // Magnet attraction
    if (hasMagnet) {
      const coinPos = new THREE.Vector3(coin.position.x, coin.position.y, coin.position.z);
      const playerPos = new THREE.Vector3(player.position.x, player.position.y, player.position.z);
      const distance = coinPos.distanceTo(playerPos);

      if (distance < magnetRadius && !isAnimating) {
        setIsAnimating(true);
      }
    }

    // Animate towards player if magnet is active and in range
    if (isAnimating) {
      const targetX = player.position.x;
      const targetY = player.position.y;
      const targetZ = player.position.z;

      const dx = targetX - meshRef.current.position.x;
      const dy = targetY - meshRef.current.position.y;
      const dz = targetZ - meshRef.current.position.z;

      const speed = 20;
      meshRef.current.position.x += dx * delta * speed;
      meshRef.current.position.y += dy * delta * speed;
      meshRef.current.position.z += dz * delta * speed;

      // Check if reached player
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 0.5) {
        handleCollect();
      }
    }
  });

  const handleCollect = () => {
    if (isCollected) return;
    setIsCollected(true);
    onCollect(coin);
  };

  if (isCollected) return null;

  return (
    <RigidBody
      type="fixed"
      position={[coin.position.x, coin.position.y, coin.position.z]}
      sensor
      onIntersectionEnter={handleCollect}
      userData={{ type: 'coin', data: coin }}
    >
      <CuboidCollider args={[0.3, 0.3, 0.3]} sensor />

      <mesh ref={meshRef} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.1, 16]} />
        <meshStandardMaterial
          color={COLORS.COIN}
          emissive={COLORS.COIN}
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Glow effect */}
      <pointLight
        color={COLORS.COIN}
        intensity={0.5}
        distance={2}
      />
    </RigidBody>
  );
}

// Instanced coins for better performance
interface CoinsRendererProps {
  coins: CoinState[];
  onCollect: (coin: CoinState) => void;
}

export function CoinsRenderer({ coins, onCollect }: CoinsRendererProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const [collectedIds, setCollectedIds] = useState<Set<string>>(new Set());

  const { player, activePowerUps } = useGameStore();
  const user = useUserStore((state) => state.user);

  // Check for magnet power-up
  const hasMagnet = activePowerUps.some(p => p.type === GateType.MAGNET);
  const magnetLevel = user?.upgrades.magnetRadius || 0;
  const magnetRadius = getMagnetRadius(magnetLevel);

  // Track coin positions for magnet effect
  const coinPositions = useRef<Map<string, THREE.Vector3>>(new Map());

  // Initialize positions
  useMemo(() => {
    coins.forEach(coin => {
      coinPositions.current.set(coin.id, new THREE.Vector3(
        coin.position.x,
        coin.position.y,
        coin.position.z
      ));
    });
  }, [coins]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const time = state.clock.elapsedTime;
    const playerPos = new THREE.Vector3(player.position.x, player.position.y, player.position.z);

    coins.forEach((coin, i) => {
      if (collectedIds.has(coin.id)) {
        dummy.scale.setScalar(0);
      } else {
        const pos = coinPositions.current.get(coin.id)!;

        // Magnet attraction
        if (hasMagnet) {
          const distance = pos.distanceTo(playerPos);

          if (distance < magnetRadius) {
            const dir = playerPos.clone().sub(pos).normalize();
            const speed = 20;
            pos.add(dir.multiplyScalar(speed * delta));

            // Check if collected
            if (distance < 0.5) {
              setCollectedIds(prev => new Set(prev).add(coin.id));
              onCollect(coin);
            }
          }
        }

        // Check collision with player
        const distToPlayer = pos.distanceTo(playerPos);
        if (distToPlayer < 1) {
          setCollectedIds(prev => new Set(prev).add(coin.id));
          onCollect(coin);
        }

        dummy.position.copy(pos);
        dummy.rotation.y = time * 3 + i * 0.5;
        dummy.scale.setScalar(1);
      }

      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, coins.length]} castShadow>
      <cylinderGeometry args={[0.25, 0.25, 0.1, 16]} />
      <meshStandardMaterial
        color={COLORS.COIN}
        emissive={COLORS.COIN}
        emissiveIntensity={0.5}
        metalness={0.8}
        roughness={0.2}
      />
    </instancedMesh>
  );
}
