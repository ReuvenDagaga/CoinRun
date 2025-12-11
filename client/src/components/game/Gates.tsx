import { useRef, memo, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { useGameStore } from '@/store/gameStore';
import {
  SimpleGateType,
  GateData,
  GATE_CONFIGS,
} from './gateTypes';
import { GROUND_Y } from './Player';

// Gate dimensions
const GATE_WIDTH = 8;
const GATE_HEIGHT = 6;
const PILLAR_WIDTH = 0.6;

// Single Gate component
interface GateProps {
  gate: GateData;
  onTrigger: (gateId: string, gateType: SimpleGateType) => void;
}

const SingleGate = memo(function SingleGate({ gate, onTrigger }: GateProps) {
  const groupRef = useRef<THREE.Group>(null);
  const innerGlowRef = useRef<THREE.Mesh>(null);
  const isTriggeredRef = useRef(false);

  const { player, status } = useGameStore();
  const config = GATE_CONFIGS[gate.type];

  // Create glowing material
  const glowMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: config.color,
        emissive: config.color,
        emissiveIntensity: config.emissiveIntensity,
        metalness: 0.3,
        roughness: 0.4,
      }),
    [config.color, config.emissiveIntensity]
  );

  const innerGlowMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: config.color,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
      }),
    [config.color]
  );

  useFrame((state) => {
    if (!groupRef.current || isTriggeredRef.current || status !== 'playing') return;

    // Check if player passes through gate
    const playerZ = player.position.z;
    const gateZ = gate.position.z;

    // Trigger when player passes through (within 1.5m of gate Z position)
    if (Math.abs(playerZ - gateZ) < 1.5 && playerZ > gateZ - 2) {
      isTriggeredRef.current = true;
      onTrigger(gate.id, gate.type);
      return;
    }

    // Gentle animations
    const time = state.clock.elapsedTime;

    // Subtle rotation wobble
    groupRef.current.rotation.y = Math.sin(time * 1.5) * 0.05;

    // Inner glow pulse
    if (innerGlowRef.current) {
      const pulse = 0.2 + Math.sin(time * 3) * 0.1;
      (innerGlowRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
    }
  });

  // Don't render if triggered
  if (gate.isTriggered) return null;

  const baseY = GROUND_Y + GATE_HEIGHT / 2;

  return (
    <group
      ref={groupRef}
      position={[gate.position.x, 0, gate.position.z]}
    >
      {/* Left Pillar */}
      <mesh position={[-GATE_WIDTH / 2, baseY, 0]} material={glowMaterial} castShadow>
        <boxGeometry args={[PILLAR_WIDTH, GATE_HEIGHT, PILLAR_WIDTH]} />
      </mesh>

      {/* Right Pillar */}
      <mesh position={[GATE_WIDTH / 2, baseY, 0]} material={glowMaterial} castShadow>
        <boxGeometry args={[PILLAR_WIDTH, GATE_HEIGHT, PILLAR_WIDTH]} />
      </mesh>

      {/* Top Bar */}
      <mesh position={[0, GROUND_Y + GATE_HEIGHT + PILLAR_WIDTH / 2, 0]} material={glowMaterial} castShadow>
        <boxGeometry args={[GATE_WIDTH + PILLAR_WIDTH, PILLAR_WIDTH, PILLAR_WIDTH]} />
      </mesh>

      {/* Inner Glow Plane */}
      <mesh
        ref={innerGlowRef}
        position={[0, baseY, 0]}
        material={innerGlowMaterial}
      >
        <planeGeometry args={[GATE_WIDTH - PILLAR_WIDTH, GATE_HEIGHT - 0.5]} />
      </mesh>

      {/* Decorative ring around gate */}
      <mesh position={[0, baseY, 0]} rotation={[0, 0, Math.PI / 4]}>
        <torusGeometry args={[GATE_WIDTH / 2 + 0.5, 0.08, 8, 32]} />
        <meshBasicMaterial color={config.color} transparent opacity={0.4} />
      </mesh>

      {/* Floating Label Text */}
      <group position={[0, GROUND_Y + GATE_HEIGHT + 1.5, 0]}>
        {/* Background for text */}
        <mesh position={[0, 0, -0.1]}>
          <planeGeometry args={[4, 1]} />
          <meshBasicMaterial
            color={config.isPositive ? '#004400' : '#440000'}
            transparent
            opacity={0.7}
          />
        </mesh>

        {/* Label text */}
        <Text
          position={[0, 0, 0]}
          fontSize={0.6}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="#000000"
          font={undefined}
        >
          {config.label}
        </Text>
      </group>

      {/* Bottom ground indicator */}
      <mesh
        position={[0, 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[GATE_WIDTH + 1, 2]} />
        <meshBasicMaterial
          color={config.color}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Point lights for glow effect */}
      <pointLight
        position={[-GATE_WIDTH / 2, baseY, 0.5]}
        color={config.color}
        intensity={0.5}
        distance={5}
      />
      <pointLight
        position={[GATE_WIDTH / 2, baseY, 0.5]}
        color={config.color}
        intensity={0.5}
        distance={5}
      />
    </group>
  );
});

// Gates renderer - renders all gates
interface GatesProps {
  gates: GateData[];
  onGateTrigger: (gateId: string, gateType: SimpleGateType) => void;
}

export const GatesRenderer = memo(function GatesRenderer({
  gates,
  onGateTrigger,
}: GatesProps) {
  // Filter out triggered gates
  const activeGates = useMemo(
    () => gates.filter((g) => !g.isTriggered),
    [gates]
  );

  return (
    <group>
      {activeGates.map((gate) => (
        <SingleGate
          key={gate.id}
          gate={gate}
          onTrigger={onGateTrigger}
        />
      ))}
    </group>
  );
});

export default GatesRenderer;
