import { memo, useMemo, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGame } from '@/context';
import CoinModel from './CoinModel';
import { CoinData, COLLECTION_RADIUS } from './coinTypes';

// New tighter, organic formation constants (must match ArmyFollowers.tsx)
const SOLDIERS_PER_ROW = 3;
const SPACING_X = 0.8; // Reduced from 1.2 - much tighter
const SPACING_Z = 1.0; // Reduced from 1.5 - closer together
const BACK_OFFSET = -1.5; // Closer to player

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

  // Base position in tighter grid
  const baseXOffset = (col - (SOLDIERS_PER_ROW - 1) / 2) * SPACING_X;
  const baseZOffset = BACK_OFFSET - row * SPACING_Z;

  // Add seeded random offsets for organic feel (must match ArmyFollowers.tsx)
  const seedX = index * 7 + 13;
  const seedZ = index * 11 + 17;
  const randomXOffset = (seededRandom(seedX) - 0.5) * 0.6; // ±0.3 units
  const randomZOffset = (seededRandom(seedZ) - 0.5) * 0.4; // ±0.2 units

  // Soldiers closer to front are more centered, back rows spread wider
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

    for (let i = 0; i < armySize; i++) {
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

import { useRef } from 'react';

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

  const visibleCoins = useMemo(() => {
    const playerZ = player.position.z;
    const viewDistance = 80;
    return coins.filter(
      (c) =>
        !c.isCollected &&
        c.position.z > playerZ - 15 &&
        c.position.z < playerZ + viewDistance
    );
  }, [coins, player.position.z]);

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