// Coin types and generation for CoinRun

export type CoinPattern = 'horizontal' | 'vertical' | 'diagonal';

export interface CoinData {
  id: string;
  position: { x: number; y: number; z: number };
  isCollected: boolean;
  patternId: string;
}

export interface CoinGroup {
  id: string;
  pattern: CoinPattern;
  coins: CoinData[];
  centerZ: number;
}

// Coin visual constants
export const COIN_RADIUS = 0.3; // 0.6m diameter
export const COIN_HEIGHT = 0.1; // thickness
export const COIN_FLOAT_HEIGHT = 1.0; // height above ground
export const COIN_COLOR = '#FFD700'; // Gold
export const COLLECTION_RADIUS = 1.0; // 1m collection radius

// Generation constants
const MIN_COINS_PER_GROUP = 5;
const MAX_COINS_PER_GROUP = 15;
const MIN_GROUP_SPACING = 30; // meters between groups
const MAX_GROUP_SPACING = 50;
const COIN_SPACING = 1.2; // spacing between coins in a line
const TRACK_HALF_WIDTH = 4; // stay within -4 to +4

// Generate coin groups along the track
export function generateCoins(trackLength: number = 800): CoinData[] {
  const coins: CoinData[] = [];
  let currentZ = 50; // Start at 50m
  let groupIndex = 0;

  while (currentZ < trackLength - 50) {
    // Choose pattern type: 80% straight (horizontal/vertical), 20% diagonal
    const patternRoll = Math.random();
    let pattern: CoinPattern;

    if (patternRoll < 0.4) {
      pattern = 'horizontal';
    } else if (patternRoll < 0.8) {
      pattern = 'vertical';
    } else {
      pattern = 'diagonal';
    }

    // Random group size
    const groupSize = MIN_COINS_PER_GROUP + Math.floor(Math.random() * (MAX_COINS_PER_GROUP - MIN_COINS_PER_GROUP + 1));

    // Random X position for group center
    const centerX = (Math.random() - 0.5) * (TRACK_HALF_WIDTH * 1.5); // -3 to +3

    const patternId = `group-${groupIndex}`;

    // Generate coins based on pattern
    const groupCoins = generateCoinPattern(pattern, groupSize, centerX, currentZ, patternId);
    coins.push(...groupCoins);

    // Move to next group position
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
      // Horizontal line across track
      const startX = centerX - ((count - 1) * COIN_SPACING) / 2;
      for (let i = 0; i < count; i++) {
        const x = startX + i * COIN_SPACING;
        // Clamp to track bounds
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
      // Vertical line along track direction
      const startZ = centerZ;
      for (let i = 0; i < count; i++) {
        coins.push({
          id: `coin-${patternId}-${i}`,
          position: {
            x: Math.max(-TRACK_HALF_WIDTH, Math.min(TRACK_HALF_WIDTH, centerX)),
            y: COIN_FLOAT_HEIGHT,
            z: startZ + i * COIN_SPACING
          },
          isCollected: false,
          patternId,
        });
      }
      break;
    }

    case 'diagonal': {
      // Diagonal line at ~45 degrees
      const direction = Math.random() < 0.5 ? 1 : -1; // Left or right diagonal
      const startX = centerX - ((count - 1) * COIN_SPACING * 0.7 * direction) / 2;
      const startZ = centerZ - ((count - 1) * COIN_SPACING * 0.7) / 2;

      for (let i = 0; i < count; i++) {
        const x = startX + i * COIN_SPACING * 0.7 * direction;
        const z = startZ + i * COIN_SPACING * 0.7;
        // Clamp to track bounds
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
