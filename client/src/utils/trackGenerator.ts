import {
  TrackData,
  TrackSection,
  SectionType,
  EnemyType,
  GateType,
  ObstacleType,
  EnemyState,
  GateState,
  ObstacleState,
  CoinState,
  GAME_CONSTANTS
} from '@shared/types/game.types';

// Seeded random number generator
class SeededRandom {
  private seed: number;

  constructor(seed: string) {
    // Convert string seed to number
    this.seed = this.hashString(seed);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  // Linear congruential generator
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  // Random integer in range [min, max]
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Random float in range [min, max]
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  // Random choice from array
  choice<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }

  // Shuffle array
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

// Section order as specified in PRD
const SECTION_ORDER: SectionType[] = [
  SectionType.INTRO,
  SectionType.EASY,
  SectionType.COMBAT,
  SectionType.PLATFORMING,
  SectionType.BONUS,
  SectionType.HARD_COMBAT,
  SectionType.SPEED,
  SectionType.COLLECTION,
  SectionType.GAUNTLET,
  SectionType.FINISH
];

// Section configurations
const SECTION_CONFIG: Record<SectionType, {
  enemies: { min: number; max: number; types: EnemyType[] };
  gates: { min: number; max: number; types: GateType[] };
  obstacles: { min: number; max: number; types: ObstacleType[] };
  coins: { min: number; max: number };
}> = {
  [SectionType.INTRO]: {
    enemies: { min: 0, max: 0, types: [] },
    gates: { min: 3, max: 5, types: [GateType.ADD, GateType.MULTIPLY] },
    obstacles: { min: 0, max: 2, types: [ObstacleType.WALL] },
    coins: { min: 20, max: 30 }
  },
  [SectionType.EASY]: {
    enemies: { min: 1, max: 2, types: [EnemyType.STATIC] },
    gates: { min: 2, max: 3, types: [GateType.ADD] },
    obstacles: { min: 2, max: 4, types: [ObstacleType.WALL] },
    coins: { min: 15, max: 25 }
  },
  [SectionType.COMBAT]: {
    enemies: { min: 3, max: 5, types: [EnemyType.STATIC, EnemyType.PATROL] },
    gates: { min: 2, max: 3, types: [GateType.ADD, GateType.BULLETS] },
    obstacles: { min: 1, max: 2, types: [ObstacleType.WALL] },
    coins: { min: 10, max: 15 }
  },
  [SectionType.PLATFORMING]: {
    enemies: { min: 0, max: 1, types: [EnemyType.STATIC] },
    gates: { min: 2, max: 3, types: [GateType.ADD, GateType.SPEED] },
    obstacles: { min: 4, max: 6, types: [ObstacleType.GAP, ObstacleType.WALL] },
    coins: { min: 15, max: 20 }
  },
  [SectionType.BONUS]: {
    enemies: { min: 0, max: 0, types: [] },
    gates: { min: 4, max: 6, types: [GateType.ADD, GateType.MULTIPLY, GateType.MAGNET] },
    obstacles: { min: 0, max: 1, types: [ObstacleType.WALL] },
    coins: { min: 30, max: 50 }
  },
  [SectionType.HARD_COMBAT]: {
    enemies: { min: 4, max: 6, types: [EnemyType.PATROL, EnemyType.CHARGER, EnemyType.BOSS] },
    gates: { min: 2, max: 4, types: [GateType.ADD, GateType.MULTIPLY, GateType.SHIELD] },
    obstacles: { min: 1, max: 2, types: [ObstacleType.WALL] },
    coins: { min: 10, max: 20 }
  },
  [SectionType.SPEED]: {
    enemies: { min: 2, max: 3, types: [EnemyType.STATIC, EnemyType.CHARGER] },
    gates: { min: 2, max: 3, types: [GateType.SPEED, GateType.ADD] },
    obstacles: { min: 3, max: 5, types: [ObstacleType.WALL, ObstacleType.GAP] },
    coins: { min: 15, max: 25 }
  },
  [SectionType.COLLECTION]: {
    enemies: { min: 0, max: 1, types: [EnemyType.STATIC] },
    gates: { min: 3, max: 4, types: [GateType.MAGNET, GateType.ADD] },
    obstacles: { min: 1, max: 2, types: [ObstacleType.WALL] },
    coins: { min: 40, max: 60 }
  },
  [SectionType.GAUNTLET]: {
    enemies: { min: 3, max: 5, types: [EnemyType.STATIC, EnemyType.PATROL, EnemyType.CHARGER] },
    gates: { min: 2, max: 3, types: [GateType.ADD, GateType.SHIELD, GateType.BULLETS] },
    obstacles: { min: 3, max: 5, types: [ObstacleType.WALL, ObstacleType.GAP] },
    coins: { min: 20, max: 30 }
  },
  [SectionType.FINISH]: {
    enemies: { min: 1, max: 2, types: [EnemyType.STATIC] },
    gates: { min: 3, max: 4, types: [GateType.ADD, GateType.MULTIPLY] },
    obstacles: { min: 1, max: 2, types: [ObstacleType.WALL] },
    coins: { min: 25, max: 35 }
  }
};

// Enemy base stats
const ENEMY_STATS: Record<EnemyType, { hp: number; damage: number; reward: number }> = {
  [EnemyType.STATIC]: { hp: 5, damage: 3, reward: 20 },
  [EnemyType.PATROL]: { hp: 10, damage: 5, reward: 40 },
  [EnemyType.CHARGER]: { hp: 15, damage: 8, reward: 60 },
  [EnemyType.BOSS]: { hp: 30, damage: 15, reward: 150 }
};

// Gate values
const GATE_VALUES: Record<GateType, number[]> = {
  [GateType.ADD]: [5, 10, 15, 20],
  [GateType.MULTIPLY]: [2, 3, 5],
  [GateType.SPEED]: [2], // 2x speed
  [GateType.SHIELD]: [10], // 10s duration
  [GateType.MAGNET]: [15], // 15s duration
  [GateType.BULLETS]: [30] // 30s duration
};

export function generateTrack(seed: string, difficulty: number = 1): TrackData {
  const rng = new SeededRandom(seed);
  const sections: TrackSection[] = [];
  const minSpacing = 5; // Minimum 5m between objects

  for (let i = 0; i < SECTION_ORDER.length; i++) {
    const sectionType = SECTION_ORDER[i];
    const startZ = i * GAME_CONSTANTS.SECTION_LENGTH;
    const endZ = startZ + GAME_CONSTANTS.SECTION_LENGTH;
    const config = SECTION_CONFIG[sectionType];

    const section: TrackSection = {
      type: sectionType,
      startZ,
      endZ,
      enemies: [],
      gates: [],
      obstacles: [],
      coins: []
    };

    // Track occupied positions for collision avoidance
    const occupiedPositions: { z: number; lane: number }[] = [];

    const isPositionFree = (z: number, lane: number): boolean => {
      return !occupiedPositions.some(
        pos => Math.abs(pos.z - z) < minSpacing && pos.lane === lane
      );
    };

    const addPosition = (z: number, lane: number) => {
      occupiedPositions.push({ z, lane });
    };

    // Generate gates
    const gateCount = rng.nextInt(config.gates.min, config.gates.max);
    for (let j = 0; j < gateCount; j++) {
      const gateType = rng.choice(config.gates.types);
      const value = rng.choice(GATE_VALUES[gateType]);
      const lane = rng.nextInt(0, 2);

      // Find free position
      let z = rng.nextFloat(startZ + 10, endZ - 10);
      let attempts = 0;
      while (!isPositionFree(z, lane) && attempts < 20) {
        z = rng.nextFloat(startZ + 10, endZ - 10);
        attempts++;
      }

      if (attempts < 20) {
        addPosition(z, lane);
        section.gates.push({
          id: `gate-${i}-${j}`,
          type: gateType,
          position: {
            x: (lane - 1) * GAME_CONSTANTS.LANE_WIDTH,
            y: 1.5,
            z
          },
          value,
          upgradeLevel: 0,
          isCollected: false
        });
      }
    }

    // Generate enemies
    const enemyCount = rng.nextInt(config.enemies.min, config.enemies.max);
    for (let j = 0; j < enemyCount; j++) {
      const enemyType = rng.choice(config.enemies.types);
      const stats = ENEMY_STATS[enemyType];
      const lane = rng.nextInt(0, 2);

      // Adjust HP based on difficulty
      const scaledHp = Math.floor(stats.hp * (1 + difficulty * 0.1));

      // Find free position
      let z = rng.nextFloat(startZ + 15, endZ - 15);
      let attempts = 0;
      while (!isPositionFree(z, lane) && attempts < 20) {
        z = rng.nextFloat(startZ + 15, endZ - 15);
        attempts++;
      }

      if (attempts < 20) {
        addPosition(z, lane);
        section.enemies.push({
          id: `enemy-${i}-${j}`,
          type: enemyType,
          position: {
            x: (lane - 1) * GAME_CONSTANTS.LANE_WIDTH,
            y: 0.5,
            z
          },
          hp: scaledHp,
          maxHp: scaledHp,
          damage: stats.damage,
          reward: stats.reward,
          isAlive: true
        });
      }
    }

    // Generate obstacles
    const obstacleCount = rng.nextInt(config.obstacles.min, config.obstacles.max);
    for (let j = 0; j < obstacleCount; j++) {
      const obstacleType = rng.choice(config.obstacles.types);
      const lane = rng.nextInt(0, 2);

      // Find free position
      let z = rng.nextFloat(startZ + 5, endZ - 5);
      let attempts = 0;
      while (!isPositionFree(z, lane) && attempts < 20) {
        z = rng.nextFloat(startZ + 5, endZ - 5);
        attempts++;
      }

      if (attempts < 20) {
        addPosition(z, lane);
        section.obstacles.push({
          id: `obstacle-${i}-${j}`,
          type: obstacleType,
          position: {
            x: (lane - 1) * GAME_CONSTANTS.LANE_WIDTH,
            y: obstacleType === ObstacleType.GAP ? -0.5 : 0.5,
            z
          },
          width: obstacleType === ObstacleType.GAP ? 3 : 1,
          height: obstacleType === ObstacleType.GAP ? 1 : 1.5,
          lane
        });
      }
    }

    // Generate coins
    const coinCount = rng.nextInt(config.coins.min, config.coins.max);
    for (let j = 0; j < coinCount; j++) {
      const lane = rng.nextInt(0, 2);
      const z = rng.nextFloat(startZ + 2, endZ - 2);
      const y = rng.nextFloat(0.5, 2); // Coins at different heights

      section.coins.push({
        id: `coin-${i}-${j}`,
        position: {
          x: (lane - 1) * GAME_CONSTANTS.LANE_WIDTH,
          y,
          z
        },
        value: 1,
        isCollected: false
      });
    }

    sections.push(section);
  }

  return {
    seed,
    difficulty,
    sections,
    totalLength: GAME_CONSTANTS.TRACK_LENGTH
  };
}

// Generate a random seed
export function generateSeed(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Get section info for current position
export function getCurrentSection(z: number, track: TrackData): TrackSection | null {
  return track.sections.find(
    section => z >= section.startZ && z < section.endZ
  ) || null;
}

// Get objects within range of player
export function getObjectsInRange<T extends { position: { z: number } }>(
  objects: T[],
  playerZ: number,
  range: number
): T[] {
  return objects.filter(
    obj => Math.abs(obj.position.z - playerZ) <= range
  );
}
