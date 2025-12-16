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
