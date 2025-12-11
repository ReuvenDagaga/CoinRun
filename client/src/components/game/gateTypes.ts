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
    label: '/2 ARMY!',
    emissiveIntensity: 1.0,
    isPositive: false,
  },
};

// Generate gates along the track
export function generateGates(trackLength: number = 800): GateData[] {
  const gates: GateData[] = [];
  const GATE_SPACING = 80; // Every 80m

  const gateTypes = [
    SimpleGateType.SPEED_BOOST,
    SimpleGateType.SPEED_SLOW,
    SimpleGateType.MULTIPLY_ARMY,
    SimpleGateType.REDUCE_ARMY,
  ];

  // Predefined gate sequence for balanced gameplay
  const gateSequence = [
    SimpleGateType.SPEED_BOOST,    // 100m - start with a boost
    SimpleGateType.MULTIPLY_ARMY,  // 180m - grow army
    SimpleGateType.SPEED_SLOW,     // 260m - challenge
    SimpleGateType.SPEED_BOOST,    // 340m - boost
    SimpleGateType.REDUCE_ARMY,    // 420m - challenge
    SimpleGateType.MULTIPLY_ARMY,  // 500m - grow army
    SimpleGateType.SPEED_BOOST,    // 580m - boost for final stretch
    SimpleGateType.SPEED_SLOW,     // 660m - final challenge
    SimpleGateType.MULTIPLY_ARMY,  // 740m - last chance to grow
  ];

  // Start at 100m (give player time to collect some soldiers)
  let z = 100;
  for (let i = 0; i < gateSequence.length && z < trackLength - 60; i++) {
    gates.push({
      id: `gate-${z}`,
      type: gateSequence[i],
      position: { x: 0, y: 0, z },
      isTriggered: false,
    });
    z += GATE_SPACING;
  }

  return gates;
}

// Effect durations
export const SPEED_EFFECT_DURATION = 5000; // 5 seconds
export const SPEED_BOOST_MULTIPLIER = 1.5; // +50% speed
export const SPEED_SLOW_MULTIPLIER = 0.5; // -50% speed
