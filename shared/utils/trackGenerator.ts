/**
 * Track Generator - Procedurally generate game tracks with seeding
 * Generates identical tracks on server and both clients using the same seed
 */
import { SeededRandom } from './seededRandom.js';

export interface TrackSegment {
  type: 'PLATFORM' | 'GAP' | 'COINS' | 'SOLDIERS' | 'OBSTACLE' | 'GATE';
  position: number;      // Z position on track
  lane: number;          // -1 (left), 0 (center), 1 (right)
  length?: number;       // For platforms/gaps
  count?: number;        // For coin/soldier groups
  value?: number;        // For gates/power-ups
}

export interface TrackConfig {
  seed: number;
  length: number;        // Track length in units (e.g., 5000)
  difficulty?: number;   // 0-1 (affects obstacle density)
}

export interface GeneratedTrack {
  seed: number;
  length: number;
  segments: TrackSegment[];
  coinCount: number;
  soldierCount: number;
  obstacleCount: number;
  maxTime: number;       // Calculated: (length / 1000) * 30
}

/**
 * Generate a complete track from seed
 */
export function generateTrack(config: TrackConfig): GeneratedTrack {
  const { seed, length, difficulty = 0.5 } = config;
  const rng = new SeededRandom(seed);

  const segments: TrackSegment[] = [];
  let coinCount = 0;
  let soldierCount = 0;
  let obstacleCount = 0;

  // Generate track in segments
  let currentPosition = 100; // Start 100 units in (give player time to start)

  while (currentPosition < length - 200) { // Leave 200 units at end
    const segmentType = chooseSegmentType(rng, difficulty, currentPosition / length);
    const lane = rng.nextInt(-1, 1);

    switch (segmentType) {
      case 'COINS': {
        const count = rng.nextInt(3, 8);
        segments.push({
          type: 'COINS',
          position: currentPosition,
          lane,
          count
        });
        coinCount += count;
        currentPosition += rng.nextInt(80, 150);
        break;
      }

      case 'SOLDIERS': {
        const count = rng.nextInt(2, 5);
        segments.push({
          type: 'SOLDIERS',
          position: currentPosition,
          lane,
          count
        });
        soldierCount += count;
        currentPosition += rng.nextInt(150, 250);
        break;
      }

      case 'OBSTACLE': {
        segments.push({
          type: 'OBSTACLE',
          position: currentPosition,
          lane
        });
        obstacleCount++;
        currentPosition += rng.nextInt(100, 180);
        break;
      }

      case 'GATE': {
        // Gate affects all lanes
        const gateType = rng.nextBoolean() ? 'MULTIPLY' : 'ADD';
        const value = gateType === 'MULTIPLY' ? rng.nextInt(2, 3) : rng.nextInt(5, 15);

        segments.push({
          type: 'GATE',
          position: currentPosition,
          lane: 0, // Center (affects all)
          value
        });
        currentPosition += rng.nextInt(200, 350);
        break;
      }

      case 'GAP': {
        const gapLength = rng.nextInt(50, 120);
        segments.push({
          type: 'GAP',
          position: currentPosition,
          lane,
          length: gapLength
        });
        currentPosition += gapLength + rng.nextInt(100, 200);
        break;
      }

      default:
        currentPosition += rng.nextInt(100, 200);
    }
  }

  // Calculate max time
  const maxTime = (length / 1000) * 30; // 30 seconds per 1000 units

  return {
    seed,
    length,
    segments,
    coinCount,
    soldierCount,
    obstacleCount,
    maxTime
  };
}

/**
 * Choose segment type based on difficulty and progression
 */
function chooseSegmentType(
  rng: SeededRandom,
  difficulty: number,
  progression: number // 0-1
): TrackSegment['type'] {
  const rand = rng.next();

  // Early game (first 20%) - more coins/soldiers, fewer obstacles
  if (progression < 0.2) {
    if (rand < 0.4) return 'COINS';
    if (rand < 0.7) return 'SOLDIERS';
    if (rand < 0.85) return 'OBSTACLE';
    return 'GATE';
  }

  // Mid game (20-70%) - balanced
  if (progression < 0.7) {
    if (rand < 0.25) return 'COINS';
    if (rand < 0.45) return 'SOLDIERS';
    if (rand < 0.65 + difficulty * 0.15) return 'OBSTACLE';
    if (rand < 0.85) return 'GATE';
    return 'GAP';
  }

  // End game (70-100%) - harder, more obstacles
  if (rand < 0.2) return 'COINS';
  if (rand < 0.35) return 'SOLDIERS';
  if (rand < 0.6 + difficulty * 0.2) return 'OBSTACLE';
  if (rand < 0.8) return 'GATE';
  return 'GAP';
}

/**
 * Validate that two tracks generated from same seed are identical
 */
export function validateTrackSync(track1: GeneratedTrack, track2: GeneratedTrack): boolean {
  if (track1.seed !== track2.seed) return false;
  if (track1.length !== track2.length) return false;
  if (track1.segments.length !== track2.segments.length) return false;

  // Check segment equality
  for (let i = 0; i < track1.segments.length; i++) {
    const s1 = track1.segments[i];
    const s2 = track2.segments[i];

    if (
      s1.type !== s2.type ||
      s1.position !== s2.position ||
      s1.lane !== s2.lane ||
      s1.length !== s2.length ||
      s1.count !== s2.count ||
      s1.value !== s2.value
    ) {
      return false;
    }
  }

  return true;
}
