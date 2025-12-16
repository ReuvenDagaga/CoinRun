export type CoinPattern = 'horizontal' | 'vertical' | 'diagonal' | 'arc' | 'zigzag';

export interface CoinData {
  id: string;
  position: { x: number; y: number; z: number };
  isCollected: boolean;
  patternId: string;
}

export const COIN_RADIUS = 0.6;
export const COIN_FLOAT_HEIGHT = 1.5;
export const COLLECTION_RADIUS = 1.2;

const MIN_COINS_PER_GROUP = 5;
const MAX_COINS_PER_GROUP = 10;
const MIN_GROUP_SPACING = 40;
const MAX_GROUP_SPACING = 60;
const COIN_SPACING = 2.0;
const TRACK_HALF_WIDTH = 4;

export function generateCoins(trackLength: number = 800): CoinData[] {
  const coins: CoinData[] = [];
  let currentZ = 50;
  let groupIndex = 0;

  while (currentZ < trackLength - 50) {
    const patternRoll = Math.random();
    let pattern: CoinPattern;

    if (patternRoll < 0.35) {
      pattern = 'horizontal';
    } else if (patternRoll < 0.65) {
      pattern = 'vertical';
    } else if (patternRoll < 0.85) {
      pattern = 'arc';
    } else {
      pattern = 'zigzag';
    }

    const groupSize = MIN_COINS_PER_GROUP + Math.floor(Math.random() * (MAX_COINS_PER_GROUP - MIN_COINS_PER_GROUP + 1));
    const centerX = (Math.random() - 0.5) * (TRACK_HALF_WIDTH * 1.5);
    const patternId = `group-${groupIndex}`;

    const groupCoins = generateCoinPattern(pattern, groupSize, centerX, currentZ, patternId);
    coins.push(...groupCoins);

    const spacing = MIN_GROUP_SPACING + Math.random() * (MAX_GROUP_SPACING - MIN_GROUP_SPACING);
    currentZ += spacing;
    groupIndex++;
  }

  return coins;
}

function generateCoinPattern(
  pattern: CoinPattern,
  count: number,
  centerX: number,
  centerZ: number,
  patternId: string
): CoinData[] {
  const coins: CoinData[] = [];

  switch (pattern) {
    case 'horizontal': {
      const startX = centerX - ((count - 1) * COIN_SPACING) / 2;
      for (let i = 0; i < count; i++) {
        const x = startX + i * COIN_SPACING;
        const clampedX = Math.max(-TRACK_HALF_WIDTH, Math.min(TRACK_HALF_WIDTH, x));
        coins.push({
          id: `coin-${patternId}-${i}`,
          position: { x: clampedX, y: COIN_FLOAT_HEIGHT, z: centerZ },
          isCollected: false,
          patternId,
        });
      }
      break;
    }

    case 'vertical': {
      for (let i = 0; i < count; i++) {
        coins.push({
          id: `coin-${patternId}-${i}`,
          position: {
            x: Math.max(-TRACK_HALF_WIDTH, Math.min(TRACK_HALF_WIDTH, centerX)),
            y: COIN_FLOAT_HEIGHT,
            z: centerZ + i * COIN_SPACING
          },
          isCollected: false,
          patternId,
        });
      }
      break;
    }

    case 'arc': {
      const arcRadius = 3;
      const arcAngle = Math.PI * 0.5;
      const startAngle = -arcAngle / 2;

      for (let i = 0; i < count; i++) {
        const angle = startAngle + (arcAngle * i) / (count - 1);
        const x = centerX + Math.sin(angle) * arcRadius;
        const z = centerZ + (1 - Math.cos(angle)) * arcRadius;
        const clampedX = Math.max(-TRACK_HALF_WIDTH, Math.min(TRACK_HALF_WIDTH, x));

        coins.push({
          id: `coin-${patternId}-${i}`,
          position: { x: clampedX, y: COIN_FLOAT_HEIGHT, z },
          isCollected: false,
          patternId,
        });
      }
      break;
    }

    case 'zigzag': {
      const zigWidth = 1.5;
      for (let i = 0; i < count; i++) {
        const zigOffset = (i % 2 === 0 ? -1 : 1) * zigWidth;
        const x = centerX + zigOffset;
        const clampedX = Math.max(-TRACK_HALF_WIDTH, Math.min(TRACK_HALF_WIDTH, x));

        coins.push({
          id: `coin-${patternId}-${i}`,
          position: {
            x: clampedX,
            y: COIN_FLOAT_HEIGHT,
            z: centerZ + i * COIN_SPACING * 0.7
          },
          isCollected: false,
          patternId,
        });
      }
      break;
    }

    default: {
      const direction = Math.random() < 0.5 ? 1 : -1;
      for (let i = 0; i < count; i++) {
        const x = centerX + i * COIN_SPACING * 0.5 * direction;
        const z = centerZ + i * COIN_SPACING * 0.7;
        const clampedX = Math.max(-TRACK_HALF_WIDTH, Math.min(TRACK_HALF_WIDTH, x));
        coins.push({
          id: `coin-${patternId}-${i}`,
          position: { x: clampedX, y: COIN_FLOAT_HEIGHT, z },
          isCollected: false,
          patternId,
        });
      }
      break;
    }
  }

  return coins;
}