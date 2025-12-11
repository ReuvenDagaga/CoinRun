// Gate types and configurations for CoinRun
// Green gates = positive effects, Red gates = negative effects

export enum SimpleGateType {
  SPEED_BOOST = 'speed_boost',
  SPEED_SLOW = 'speed_slow',
  MULTIPLY_ARMY = 'multiply_army',
  REDUCE_ARMY = 'reduce_army',
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
  [SimpleGateType.SPEED_BOOST]: {
    color: '#32CD32', // Lime Green
    label: 'SPEED UP!',
    emissiveIntensity: 1.5,
    isPositive: true,
  },
  [SimpleGateType.SPEED_SLOW]: {
    color: '#DC143C', // Crimson Red
    label: 'SLOW DOWN!',
    emissiveIntensity: 1.2,
    isPositive: false,
  },
  [SimpleGateType.MULTIPLY_ARMY]: {
    color: '#00FF00', // Bright Green
    label: 'x2 ARMY!',
    emissiveIntensity: 1.8,
    isPositive: true,
  },
  [SimpleGateType.REDUCE_ARMY]: {
    color: '#8B0000', // Dark Red
    label: 'HALF ARMY!',
    emissiveIntensity: 1.0,
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
    SimpleGateType.SPEED_BOOST,
    SimpleGateType.SPEED_SLOW,
    SimpleGateType.MULTIPLY_ARMY,
    SimpleGateType.REDUCE_ARMY,
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

// Effect durations
export const SPEED_EFFECT_DURATION = 5000; // 5 seconds
export const SPEED_BOOST_MULTIPLIER = 1.5; // +50% speed
export const SPEED_SLOW_MULTIPLIER = 0.5; // -50% speed
