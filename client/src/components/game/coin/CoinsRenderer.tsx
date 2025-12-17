import { memo, useMemo, useRef, Suspense, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGame } from '@/context';
import CoinModel from './CoinModel';
import { CoinData, COLLECTION_RADIUS } from './coinTypes';
import { CHUNK_CONFIG, buildChunkIndex, getObjectsFromChunks } from '../utils/ChunkManager';

// New tighter, organic formation constants (must match ArmyFollowers.tsx)
const SOLDIERS_PER_ROW = 3;
const SPACING_X = 0.8;
const SPACING_Z = 1.0;
const BACK_OFFSET = -1.5;

// Seeded random for consistent randomization per soldier
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function getArmyPosition(
  index: number,
  playerX: number,
  playerZ: number
): { x: number; z: number } {
  const row = Math.floor(index / SOLDIERS_PER_ROW);
  const col = index % SOLDIERS_PER_ROW;

  const baseXOffset = (col - (SOLDIERS_PER_ROW - 1) / 2) * SPACING_X;
  const baseZOffset = BACK_OFFSET - row * SPACING_Z;

  const seedX = index * 7 + 13;
  const seedZ = index * 11 + 17;
  const randomXOffset = (seededRandom(seedX) - 0.5) * 0.6;
  const randomZOffset = (seededRandom(seedZ) - 0.5) * 0.4;

  const rowSpreadMultiplier = 1 + row * 0.1;
  const adjustedXOffset = baseXOffset * rowSpreadMultiplier;

  return {
    x: playerX + adjustedXOffset + randomXOffset,
    z: playerZ + baseZOffset + randomZOffset,
  };
}

interface SingleCoinWrapperProps {
  coin: CoinData;
  onCollect: (coinId: string) => void;
  armySize: number;
  playerX: number;
  playerZ: number;
}

const SingleCoinWrapper = memo(function SingleCoinWrapper({
  coin,
  onCollect,
  armySize,
  playerX,
  playerZ,
}: SingleCoinWrapperProps) {
  const collected = useRef(false);

  useFrame(() => {
    if (collected.current || coin.isCollected) return;

    const checkCollision = (posX: number, posZ: number): boolean => {
      const dx = posX - coin.position.x;
      const dz = posZ - coin.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      return distance < COLLECTION_RADIUS;
    };

    if (checkCollision(playerX, playerZ)) {
      collected.current = true;
      onCollect(coin.id);
      return;
    }

    // Only check first 20 soldiers for performance
    const soldiersToCheck = Math.min(armySize, 20);
    for (let i = 0; i < soldiersToCheck; i++) {
      const soldierPos = getArmyPosition(i, playerX, playerZ);
      if (checkCollision(soldierPos.x, soldierPos.z)) {
        collected.current = true;
        onCollect(coin.id);
        return;
      }
    }
  });

  return (
    <CoinModel
      position={[coin.position.x, coin.position.y, coin.position.z]}
      isCollected={coin.isCollected}
    />
  );
});

interface CoinsRendererProps {
  coins: CoinData[];
  onCoinCollect: (coinId: string) => void;
  armySize: number;
}

export const CoinsRenderer = memo(function CoinsRenderer({
  coins,
  onCoinCollect,
  armySize,
}: CoinsRendererProps) {
  const { player } = useGame();

  // Build spatial index once when coins change
  const chunkIndex = useMemo(() => {
    return buildChunkIndex(coins);
  }, [coins]);

  // Track collected coin IDs for fast lookup
  const collectedIds = useRef(new Set<string>());

  // Update collected IDs when coins change
  useEffect(() => {
    collectedIds.current.clear();
    for (const coin of coins) {
      if (coin.isCollected) {
        collectedIds.current.add(coin.id);
      }
    }
  }, [coins]);

  // Get visible coins using chunk-based spatial query
  // Only recompute when player moves significantly (every 10 units)
  const playerZBucket = Math.floor(player.position.z / 10) * 10;

  const visibleCoins = useMemo(() => {
    const chunkedCoins = getObjectsFromChunks(chunkIndex, player.position.z);

    // Filter to exact render window and uncollected
    const minZ = player.position.z - CHUNK_CONFIG.RENDER_BEHIND;
    const maxZ = player.position.z + CHUNK_CONFIG.RENDER_AHEAD;

    return chunkedCoins.filter(
      (c) =>
        !c.isCollected &&
        !collectedIds.current.has(c.id) &&
        c.position.z >= minZ &&
        c.position.z <= maxZ
    );
  }, [chunkIndex, playerZBucket, player.position.z]);

  return (
    <Suspense fallback={null}>
      <group>
        {visibleCoins.map((coin) => (
          <SingleCoinWrapper
            key={coin.id}
            coin={coin}
            onCollect={onCoinCollect}
            armySize={armySize}
            playerX={player.position.x}
            playerZ={player.position.z}
          />
        ))}
      </group>
    </Suspense>
  );
});

export default CoinsRenderer;