// Gate types and configurations for CoinRun
// Green gates = positive effects, Red gates = negative effects

export enum SimpleGateType {
  ADD_SOLDIERS = 'add_soldiers',
  SUBTRACT_SOLDIERS = 'subtract_soldiers',
  MULTIPLY_SOLDIERS = 'multiply_soldiers',
  DIVIDE_SOLDIERS = 'divide_soldiers',
  SPEED_BOOST = 'speed_boost',
  SLOW_DOWN = 'slow_down',
  SHIELD = 'shield',
  DOUBLE_POINTS = 'double_points',
  MAGNET = 'magnet',
  GIANT = 'giant',
  // Additional negative gates
  SUPER_SLOW = 'super_slow',
  SUBTRACT_SOLDIERS_5 = 'subtract_soldiers_5',
  SUBTRACT_SOLDIERS_10 = 'subtract_soldiers_10',
  DIVIDE_SOLDIERS_3 = 'divide_soldiers_3',
  REVERSE_CONTROLS = 'reverse_controls',
  SHRINK = 'shrink',
}

export interface GateData {
  id: string;
  type: SimpleGateType;
  position: { x: number; y: number; z: number };
  isTriggered: boolean;
  side: 'left' | 'right';
}

export interface GateConfig {
  color: string;
  label: string;
  emissiveIntensity: number;
  isPositive: boolean;
}

export const GATE_CONFIGS: Record<SimpleGateType, GateConfig> = {
  [SimpleGateType.ADD_SOLDIERS]: {
    color: '#00FF88', // Green
    label: '+5',
    emissiveIntensity: 1.5,
    isPositive: true,
  },
  [SimpleGateType.SUBTRACT_SOLDIERS]: {
    color: '#FF4444', // Red
    label: '-3',
    emissiveIntensity: 1.2,
    isPositive: false,
  },
  [SimpleGateType.MULTIPLY_SOLDIERS]: {
    color: '#FFD700', // Gold
    label: 'x2',
    emissiveIntensity: 1.8,
    isPositive: true,
  },
  [SimpleGateType.DIVIDE_SOLDIERS]: {
    color: '#FF6B00', // Orange
    label: '÷2',
    emissiveIntensity: 1.2,
    isPositive: false,
  },
  [SimpleGateType.SPEED_BOOST]: {
    color: '#00DDFF', // Cyan
    label: 'SPEED UP',
    emissiveIntensity: 1.5,
    isPositive: true,
  },
  [SimpleGateType.SLOW_DOWN]: {
    color: '#8B4513', // Brown
    label: 'SLOW',
    emissiveIntensity: 1.0,
    isPositive: false,
  },
  [SimpleGateType.SHIELD]: {
    color: '#9966FF', // Purple
    label: 'SHIELD',
    emissiveIntensity: 1.6,
    isPositive: true,
  },
  [SimpleGateType.DOUBLE_POINTS]: {
    color: '#FF69B4', // Pink
    label: '2x POINTS',
    emissiveIntensity: 1.4,
    isPositive: true,
  },
  [SimpleGateType.MAGNET]: {
    color: '#FF1493', // Magenta
    label: 'MAGNET',
    emissiveIntensity: 1.5,
    isPositive: true,
  },
  [SimpleGateType.GIANT]: {
    color: '#FFD700', // Gold
    label: 'GIANT',
    emissiveIntensity: 1.7,
    isPositive: true,
  },
  // Additional negative gates
  [SimpleGateType.SUPER_SLOW]: {
    color: '#1a1a80', // Dark Blue
    label: 'FREEZE',
    emissiveIntensity: 1.0,
    isPositive: false,
  },
  [SimpleGateType.SUBTRACT_SOLDIERS_5]: {
    color: '#CC0000', // Dark Red
    label: '-5',
    emissiveIntensity: 1.3,
    isPositive: false,
  },
  [SimpleGateType.SUBTRACT_SOLDIERS_10]: {
    color: '#990000', // Darker Red
    label: '-10',
    emissiveIntensity: 1.4,
    isPositive: false,
  },
  [SimpleGateType.DIVIDE_SOLDIERS_3]: {
    color: '#CC5500', // Dark Orange
    label: '÷3',
    emissiveIntensity: 1.2,
    isPositive: false,
  },
  [SimpleGateType.REVERSE_CONTROLS]: {
    color: '#660066', // Purple
    label: 'REVERSE',
    emissiveIntensity: 1.3,
    isPositive: false,
  },
  [SimpleGateType.SHRINK]: {
    color: '#666666', // Gray
    label: 'SHRINK',
    emissiveIntensity: 0.8,
    isPositive: false,
  },
};

// Gate dimensions
export const GATE_WIDTH = 5; // Half track width (track is 10m wide: -5 to +5)
export const GATE_HEIGHT = 6;

// Generate gates along the track with random left/right placement
export function generateGates(trackLength: number = 800): GateData[] {
  const gates: GateData[] = [];
  const GATE_SPACING = 80; // Every 80m

  const gateTypes = [
    SimpleGateType.ADD_SOLDIERS,
    SimpleGateType.SUBTRACT_SOLDIERS,
    SimpleGateType.MULTIPLY_SOLDIERS,
    SimpleGateType.DIVIDE_SOLDIERS,
    SimpleGateType.SPEED_BOOST,
    SimpleGateType.SLOW_DOWN,
    SimpleGateType.SHIELD,
    SimpleGateType.DOUBLE_POINTS,
    SimpleGateType.MAGNET,
    SimpleGateType.GIANT,
    // Additional negative gates
    SimpleGateType.SUPER_SLOW,
    SimpleGateType.SUBTRACT_SOLDIERS_5,
    SimpleGateType.SUBTRACT_SOLDIERS_10,
    SimpleGateType.DIVIDE_SOLDIERS_3,
    SimpleGateType.REVERSE_CONTROLS,
    SimpleGateType.SHRINK,
  ];

  // Start at 100m (give player time to collect some soldiers)
  let z = 100;
  let gateIndex = 0;

  while (z < trackLength - 60) {
    // Random gate type
    const randomType = gateTypes[Math.floor(Math.random() * gateTypes.length)];

    // Random side: left (-2.5) or right (+2.5)
    // Left half: -5 to 0, center at -2.5
    // Right half: 0 to +5, center at +2.5
    const isLeftSide = Math.random() < 0.5;
    const xPosition = isLeftSide ? -2.5 : 2.5;

    gates.push({
      id: `gate-${z}-${isLeftSide ? 'L' : 'R'}`,
      type: randomType,
      position: { x: xPosition, y: 0, z },
      isTriggered: false,
      side: isLeftSide ? 'left' : 'right',
    });

    z += GATE_SPACING;
    gateIndex++;
  }

  return gates;
}

// Effect durations (in milliseconds)
export const SPEED_EFFECT_DURATION = 5000; // 5 seconds
export const SPEED_BOOST_MULTIPLIER = 1.5; // +50% speed
export const SPEED_SLOW_MULTIPLIER = 0.5; // -50% speed
export const SUPER_SLOW_MULTIPLIER = 0.2; // -80% speed
export const SHIELD_DURATION = 5000; // 5 seconds
export const DOUBLE_POINTS_DURATION = 10000; // 10 seconds
export const MAGNET_DURATION = 8000; // 8 seconds
export const GIANT_DURATION = 5000; // 5 seconds
export const REVERSE_CONTROLS_DURATION = 5000; // 5 seconds
export const SHRINK_DURATION = 5000; // 5 seconds

// =====================
// Enemy Types (Spinner, Fist, Boulder only)
// =====================

export type EnemyType = 'spinner' | 'fist' | 'boulder';

// Base enemy data shared by all types
interface BaseEnemyData {
  id: string;
  type: EnemyType;
  position: { x: number; y: number; z: number };
}

// Spinner-specific data
export interface SpinnerData extends BaseEnemyData {
  type: 'spinner';
  rotationSpeed: number;
  spikeRadius: number;
}

// Fist-specific data
export interface FistData extends BaseEnemyData {
  type: 'fist';
  side: 'left' | 'right';
  punchCycleDuration: number; // Total cycle time in seconds
}

// Boulder-specific data
export interface BoulderData extends BaseEnemyData {
  type: 'boulder';
  radius: number;
  rotationY: number; // Random rotation for variety
}

// Union type for all enemy data (no shooter)
export type EnemyData = SpinnerData | FistData | BoulderData;

export interface EnemyConfig {
  baseColor: string;
  poleColor: string;
  spikeColor: string;
  metalColor: string;
}

// Spinner visual configuration
export const SPINNER_CONFIG: EnemyConfig = {
  baseColor: '#5D4037', // Dark wood brown
  poleColor: '#8B4513', // Saddle brown (wooden pole)
  spikeColor: '#4A4A4A', // Dark metal gray
  metalColor: '#2F2F2F', // Dark metal for bands
};

// Spinner dimensions
export const SPINNER_POLE_HEIGHT = 3.5;
export const SPINNER_POLE_RADIUS = 0.15;
export const SPINNER_SPIKE_LENGTH = 2.0;
export const SPINNER_SPIKE_TIP_LENGTH = 0.3;
export const SPINNER_SPIKE_RADIUS = 0.08;
export const SPINNER_BASE_RADIUS = 0.5;
export const SPINNER_BASE_HEIGHT = 0.3;
export const SPINNER_KILL_RADIUS = SPINNER_SPIKE_LENGTH + SPINNER_SPIKE_TIP_LENGTH + 0.2;

// Fist configuration
export const FIST_CONFIG = {
  gloveColor: '#CC2222', // Red boxing glove
  wristColor: '#FFD700', // Gold wrist band
  armColor: '#666666', // Gray metal arm
  postColor: '#444444', // Dark gray post
};
export const FIST_SIZE = 1.0; // Radius of the fist
export const FIST_ARM_LENGTH = 8.0; // Length of extendable arm
export const FIST_KILL_RADIUS = 1.2;
// Timing (in seconds)
export const FIST_WINDUP_TIME = 0.3;
export const FIST_PUNCH_TIME = 0.2;
export const FIST_HOLD_TIME = 0.5;
export const FIST_RETRACT_TIME = 1.0;
export const FIST_COOLDOWN_TIME = 2.5;
export const FIST_CYCLE_DURATION = FIST_WINDUP_TIME + FIST_PUNCH_TIME + FIST_HOLD_TIME + FIST_RETRACT_TIME + FIST_COOLDOWN_TIME;

// Boulder configuration
export const BOULDER_CONFIG = {
  primaryColor: '#7A7A7A', // Gray stone
  secondaryColor: '#5A5A5A', // Darker gray
  accentColor: '#8B7355', // Brown accent
};
export const BOULDER_RADIUS_MIN = 0.8;
export const BOULDER_RADIUS_MAX = 1.2;
export const BOULDER_PUSH_RADIUS = 1.5; // Radius for pushing soldiers aside

// Generation parameters per type
export const SPINNER_START_DISTANCE = 150;
export const SPINNER_MIN_SPACING = 60;
export const SPINNER_MAX_SPACING = 100;
export const SPINNER_ROTATION_SPEED_MIN = 0.5;
export const SPINNER_ROTATION_SPEED_MAX = 0.75;

export const FIST_START_DISTANCE = 200;
export const FIST_MIN_SPACING = 80;
export const FIST_MAX_SPACING = 120;

export const BOULDER_START_DISTANCE = 100;
export const BOULDER_MIN_SPACING = 40;
export const BOULDER_MAX_SPACING = 70;

// Legacy aliases for backwards compatibility
export const ENEMY_CONFIG = SPINNER_CONFIG;
export const ENEMY_POLE_HEIGHT = SPINNER_POLE_HEIGHT;
export const ENEMY_POLE_RADIUS = SPINNER_POLE_RADIUS;
export const ENEMY_SPIKE_LENGTH = SPINNER_SPIKE_LENGTH;
export const ENEMY_SPIKE_TIP_LENGTH = SPINNER_SPIKE_TIP_LENGTH;
export const ENEMY_SPIKE_RADIUS = SPINNER_SPIKE_RADIUS;
export const ENEMY_BASE_RADIUS = SPINNER_BASE_RADIUS;
export const ENEMY_BASE_HEIGHT = SPINNER_BASE_HEIGHT;
export const ENEMY_KILL_RADIUS = SPINNER_KILL_RADIUS;

// Generate all enemies along the track (Spinner, Fist, Boulder only)
export function generateEnemies(trackLength: number = 800): EnemyData[] {
  const enemies: EnemyData[] = [];
  let enemyIndex = 0;

  // Generate spinners
  let z = SPINNER_START_DISTANCE;
  while (z < trackLength - 50) {
    const xPosition = (Math.random() - 0.5) * 6;
    const rotationSpeed = SPINNER_ROTATION_SPEED_MIN +
      Math.random() * (SPINNER_ROTATION_SPEED_MAX - SPINNER_ROTATION_SPEED_MIN);

    enemies.push({
      id: `spinner-${enemyIndex}`,
      type: 'spinner',
      position: { x: xPosition, y: 0, z },
      rotationSpeed,
      spikeRadius: SPINNER_KILL_RADIUS,
    });

    const progressRatio = z / trackLength;
    const spacingMultiplier = 1 - (progressRatio * 0.3);
    const spacing = SPINNER_MIN_SPACING +
      Math.random() * (SPINNER_MAX_SPACING - SPINNER_MIN_SPACING) * spacingMultiplier;
    z += spacing;
    enemyIndex++;
  }

  // Generate fists
  z = FIST_START_DISTANCE;
  while (z < trackLength - 50) {
    const side: 'left' | 'right' = Math.random() < 0.5 ? 'left' : 'right';
    const xPosition = side === 'left' ? -5 : 5;

    enemies.push({
      id: `fist-${enemyIndex}`,
      type: 'fist',
      position: { x: xPosition, y: 0, z },
      side,
      punchCycleDuration: FIST_CYCLE_DURATION,
    });

    const spacing = FIST_MIN_SPACING + Math.random() * (FIST_MAX_SPACING - FIST_MIN_SPACING);
    z += spacing;
    enemyIndex++;
  }

  // Generate boulders
  z = BOULDER_START_DISTANCE;
  while (z < trackLength - 50) {
    const xPosition = (Math.random() - 0.5) * 6;
    const radius = BOULDER_RADIUS_MIN + Math.random() * (BOULDER_RADIUS_MAX - BOULDER_RADIUS_MIN);

    enemies.push({
      id: `boulder-${enemyIndex}`,
      type: 'boulder',
      position: { x: xPosition, y: 0, z },
      radius,
      rotationY: Math.random() * Math.PI * 2,
    });

    const spacing = BOULDER_MIN_SPACING + Math.random() * (BOULDER_MAX_SPACING - BOULDER_MIN_SPACING);
    z += spacing;
    enemyIndex++;
  }

  return enemies;
}
