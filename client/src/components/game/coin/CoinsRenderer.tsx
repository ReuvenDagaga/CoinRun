import { memo, useMemo, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGame } from '@/context';
import CoinModel from './CoinModel';
import { CoinData, COLLECTION_RADIUS } from './coinTypes';

const SOLDIERS_PER_ROW = 3;
const SPACING_X = 1.2;
const SPACING_Z = 1.5;
const BACK_OFFSET = -2.0;

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