import { useRef, memo, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/context';
import {
  CoinData,
  COIN_RADIUS,
  COIN_HEIGHT,
  COIN_COLOR,
  COLLECTION_RADIUS,
} from './coinTypes';

// Army formation constants (must match ArmyFollowers.tsx and Gates.tsx)
const SOLDIERS_PER_ROW = 3;
const SPACING_X = 1.2;
const SPACING_Z = 1.5;
const BACK_OFFSET = -2.0;

// Calculate formation position for a soldier at given index
function getArmyPosition(
  index: number,
  playerX: number,
  playerZ: number
): { x: number; z: number } {
  const row = Math.floor(index / SOLDIERS_PER_ROW);
  const col = index % SOLDIERS_PER_ROW;
  const xOffset = (col - (SOLDIERS_PER_ROW - 1) / 2) * SPACING_X;
  const zOffset = BACK_OFFSET - row * SPACING_Z;

  return {
    x: playerX + xOffset,
    z: playerZ + zOffset,
  };
}

// Single Coin component
interface CoinProps {
  coin: CoinData;
  onCollect: (coinId: string) => void;
  armySize: number;
}

const SingleCoin = memo(function SingleCoin({ coin, onCollect, armySize }: CoinProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const isCollectedRef = useRef(false);
  const collectAnimationRef = useRef(0); // 0 = not collecting, >0 = animation progress

  const { player, status } = useGame();

  // Gold metallic material
  const coinMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: COIN_COLOR,
        emissive: COIN_COLOR,
        emissiveIntensity: 0.3,
        metalness: 0.8,
        roughness: 0.2,
      }),
    []
  );

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Handle collection animation
    if (collectAnimationRef.current > 0) {
      collectAnimationRef.current += delta * 3; // Animation speed

      // Scale down
      const scale = Math.max(0, 1 - collectAnimationRef.current);
      meshRef.current.scale.setScalar(scale);

      // Move up slightly
      meshRef.current.position.y = coin.position.y + collectAnimationRef.current * 0.5;

      // When animation complete, hide
      if (collectAnimationRef.current >= 1) {
        meshRef.current.visible = false;
      }
      return;
    }

    // Skip collision check if already collected or not playing
    if (isCollectedRef.current || coin.isCollected || status !== 'playing') {
      // Still rotate even when not playing (for visual appeal)
      meshRef.current.rotation.y += delta * 2;
      return;
    }

    // Rotation animation (slow continuous spin on Y-axis)
    meshRef.current.rotation.y += delta * 2; // 2 radians per second

    // Optional: subtle bob animation
    const bobOffset = Math.sin(state.clock.elapsedTime * 2 + coin.position.z * 0.1) * 0.1;
    meshRef.current.position.y = coin.position.y + bobOffset;

    // Collision detection
    const playerX = player.position.x;
    const playerZ = player.position.z;
    const coinX = coin.position.x;
    const coinZ = coin.position.z;

    // Helper to check distance
    const checkCollision = (posX: number, posZ: number): boolean => {
      const dx = posX - coinX;
      const dz = posZ - coinZ;
      const distance = Math.sqrt(dx * dx + dz * dz);
      return distance < COLLECTION_RADIUS;
    };

    // Check main player
    if (checkCollision(playerX, playerZ)) {
      isCollectedRef.current = true;
      collectAnimationRef.current = 0.01; // Start animation
      onCollect(coin.id);
      return;
    }

    // Check all army soldiers
    for (let i = 0; i < armySize; i++) {
      const soldierPos = getArmyPosition(i, playerX, playerZ);
      if (checkCollision(soldierPos.x, soldierPos.z)) {
        isCollectedRef.current = true;
        collectAnimationRef.current = 0.01; // Start animation
        onCollect(coin.id);
        return;
      }
    }
  });

  // Don't render if already fully collected
  if (coin.isCollected && collectAnimationRef.current >= 1) return null;

  return (
    <mesh
      ref={meshRef}
      position={[coin.position.x, coin.position.y, coin.position.z]}
      rotation={[Math.PI / 2, 0, 0]} // Lay flat like a coin
      material={coinMaterial}
      castShadow
    >
      <cylinderGeometry args={[COIN_RADIUS, COIN_RADIUS, COIN_HEIGHT, 32]} />
    </mesh>
  );
});

// Coins renderer - renders all coins
interface CoinsProps {
  coins: CoinData[];
  onCoinCollect: (coinId: string) => void;
  armySize: number;
}

export const CoinsRenderer = memo(function CoinsRenderer({
  coins,
  onCoinCollect,
  armySize,
}: CoinsProps) {
  const { player } = useGame();

  // Only render coins within view distance for performance
  const visibleCoins = useMemo(() => {
    const playerZ = player.position.z;
    const viewDistance = 100; // Render coins within 100m
    return coins.filter(
      (c) => !c.isCollected &&
      c.position.z > playerZ - 20 &&
      c.position.z < playerZ + viewDistance
    );
  }, [coins, player.position.z]);

  return (
    <group>
      {visibleCoins.map((coin) => (
        <SingleCoin
          key={coin.id}
          coin={coin}
          onCollect={onCoinCollect}
          armySize={armySize}
        />
      ))}
    </group>
  );
});

export default CoinsRenderer;
