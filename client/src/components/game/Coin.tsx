import { useRef, useState, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import type { CoinState } from '@shared/types/game.types';
import { COLORS } from '@/utils/constants';
import { useGame, useUser } from '@/context';
import { GateType, getMagnetRadius } from '@shared/types/game.types';

// Performance constants
const RENDER_DISTANCE = 80; // Only render/animate coins within this distance
const MAGNET_CHECK_DISTANCE = 40; // Only check magnet when close

interface CoinProps {
  coin: CoinState;
  onCollect: (coin: CoinState) => void;
}

export default function Coin({ coin, onCollect }: CoinProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isCollected, setIsCollected] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const { player, activePowerUps } = useGame();
  const { userData } = useUser();
  const user = userData;

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

// Optimized instanced coins with distance culling
interface CoinsRendererProps {
  coins: CoinState[];
  onCollect: (coin: CoinState) => void;
}

export const CoinsRenderer = memo(function CoinsRenderer({ coins, onCollect }: CoinsRendererProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const collectedIds = useRef<Set<string>>(new Set());

  const { player, activePowerUps } = useGame();
  const { userData } = useUser();
  const user = userData;

  // Check for magnet power-up
  const hasMagnet = activePowerUps.some(p => p.type === GateType.MAGNET);
  const magnetLevel = user?.upgrades.magnetRadius || 0;
  const magnetRadius = getMagnetRadius(magnetLevel);

  // Track coin positions for magnet effect
  const coinPositions = useRef<Map<string, THREE.Vector3>>(new Map());

  // Initialize positions once
  useMemo(() => {
    coinPositions.current.clear();
    coins.forEach(coin => {
      coinPositions.current.set(coin.id, new THREE.Vector3(
        coin.position.x,
        coin.position.y,
        coin.position.z
      ));
    });
  }, [coins]);

  // Track collection animation state
  const collectionAnimState = useRef<Map<string, number>>(new Map());

  // Reusable vectors for calculations
  const playerPos = useMemo(() => new THREE.Vector3(), []);
  const tempDir = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const time = state.clock.elapsedTime;
    playerPos.set(player.position.x, player.position.y, player.position.z);

    let instanceNeedsUpdate = false;

    coins.forEach((coin, i) => {
      const pos = coinPositions.current.get(coin.id);
      if (!pos) return;

      // Distance culling - skip processing far coins
      const distZ = Math.abs(coin.position.z - player.position.z);

      if (collectedIds.current.has(coin.id)) {
        // Collection animation
        const animProgress = collectionAnimState.current.get(coin.id) || 0;

        if (animProgress < 1) {
          const newProgress = Math.min(animProgress + delta * 4, 1);
          collectionAnimState.current.set(coin.id, newProgress);

          const scale = newProgress < 0.5
            ? 1 + newProgress * 2
            : (1 - newProgress) * 4;

          dummy.scale.setScalar(Math.max(0, scale));
          dummy.position.set(pos.x, pos.y + newProgress * 2, pos.z);
          dummy.rotation.y = time * 10;
          instanceNeedsUpdate = true;
        } else {
          dummy.scale.setScalar(0);
        }
      } else if (distZ > RENDER_DISTANCE) {
        // Far coin - hide it
        dummy.scale.setScalar(0);
      } else {
        const originalY = coin.position.y;

        // Magnet attraction - only check when close
        if (hasMagnet && distZ < MAGNET_CHECK_DISTANCE) {
          const distance = pos.distanceTo(playerPos);

          if (distance < magnetRadius) {
            tempDir.copy(playerPos).sub(pos).normalize();
            const speed = 20;
            pos.add(tempDir.multiplyScalar(speed * delta));
            instanceNeedsUpdate = true;

            if (distance < 0.5) {
              collectedIds.current.add(coin.id);
              onCollect(coin);
            }
          }
        }

        // Check collision with player - use squared distance
        const dx = pos.x - playerPos.x;
        const dy = pos.y - playerPos.y;
        const dz = pos.z - playerPos.z;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < 1) {
          collectedIds.current.add(coin.id);
          onCollect(coin);
        }

        // Animation - reduce calculations for distant coins
        if (distZ < 50) {
          // Full animation for close coins
          const bobOffset = Math.sin(time * 2 + i * 0.5) * 0.2;
          dummy.position.set(pos.x, originalY + bobOffset, pos.z);
          dummy.rotation.y = time * 5 + i * 0.3;
          dummy.rotation.x = Math.sin(time * 3 + i) * 0.1;
          const scaleOffset = 1 + Math.sin(time * 4 + i * 0.5) * 0.1;
          dummy.scale.setScalar(scaleOffset);
        } else {
          // Simplified animation for medium distance
          dummy.position.set(pos.x, originalY, pos.z);
          dummy.rotation.y = time * 3;
          dummy.rotation.x = 0;
          dummy.scale.setScalar(1);
        }

        instanceNeedsUpdate = true;
      }

      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    if (instanceNeedsUpdate) {
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, coins.length]} castShadow>
      <cylinderGeometry args={[0.25, 0.25, 0.1, 12]} />
      <meshStandardMaterial
        color={COLORS.COIN}
        emissive={COLORS.COIN}
        emissiveIntensity={0.5}
        metalness={0.8}
        roughness={0.2}
      />
    </instancedMesh>
  );
});
