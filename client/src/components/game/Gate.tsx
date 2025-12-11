import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { GateState } from '@shared/types/game.types';
import { GateType } from '@shared/types/game.types';
import { COLORS } from '@/utils/constants';

// Gate colors based on type with distinct primary and secondary colors
const GATE_COLORS: Record<GateType, { primary: string; secondary: string; glow: string }> = {
  [GateType.ADD]: {
    primary: '#22c55e',    // Green
    secondary: '#16a34a',
    glow: '#4ade80'
  },
  [GateType.MULTIPLY]: {
    primary: '#3b82f6',    // Blue
    secondary: '#2563eb',
    glow: '#60a5fa'
  },
  [GateType.SPEED]: {
    primary: '#f59e0b',    // Yellow/Orange
    secondary: '#d97706',
    glow: '#fbbf24'
  },
  [GateType.SHIELD]: {
    primary: '#8b5cf6',    // Purple
    secondary: '#7c3aed',
    glow: '#a78bfa'
  },
  [GateType.MAGNET]: {
    primary: '#ec4899',    // Pink
    secondary: '#db2777',
    glow: '#f472b6'
  },
  [GateType.BULLETS]: {
    primary: '#ef4444',    // Red
    secondary: '#dc2626',
    glow: '#f87171'
  }
};

// Gate display text
const getGateText = (type: GateType, value: number): string => {
  switch (type) {
    case GateType.ADD:
      return `+${value}`;
    case GateType.MULTIPLY:
      return `x${value}`;
    case GateType.SPEED:
      return 'SPEED';
    case GateType.SHIELD:
      return 'SHIELD';
    case GateType.MAGNET:
      return 'MAGNET';
    case GateType.BULLETS:
      return 'BULLETS';
    default:
      return '';
  }
};

// Gate icon based on type
const getGateIcon = (type: GateType): string => {
  switch (type) {
    case GateType.ADD:
      return '+';
    case GateType.MULTIPLY:
      return '×';
    case GateType.SPEED:
      return '⚡';
    case GateType.SHIELD:
      return '🛡';
    case GateType.MAGNET:
      return '🧲';
    case GateType.BULLETS:
      return '🔫';
    default:
      return '';
  }
};

interface GateProps {
  gate: GateState;
  onCollect: (gate: GateState) => void;
}

export default function Gate({ gate, onCollect }: GateProps) {
  const groupRef = useRef<THREE.Group>(null);
  const portalRef = useRef<THREE.Mesh>(null);
  const [isCollected, setIsCollected] = useState(false);

  const colors = GATE_COLORS[gate.type];
  const text = getGateText(gate.type, gate.value);

  // Create particles for glow effect
  const particles = useMemo(() => {
    const count = 20;
    const positions: [number, number, number][] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 1.8 + Math.random() * 0.4;
      const height = Math.random() * 3 - 0.5;
      positions.push([Math.cos(angle) * radius, height, Math.sin(angle) * 0.1]);
    }
    return positions;
  }, []);

  // Animation
  useFrame((state) => {
    if (!groupRef.current || isCollected) return;

    const time = state.clock.elapsedTime;

    // Pulsing glow effect on portal
    if (portalRef.current) {
      const intensity = 0.5 + Math.sin(time * 3) * 0.3;
      const material = portalRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = intensity;
    }

    // Subtle floating of entire gate
    groupRef.current.position.y = gate.position.y + Math.sin(time * 2) * 0.1;
  });

  const handleCollision = () => {
    if (isCollected) return;
    setIsCollected(true);
    onCollect(gate);
  };

  if (isCollected) return null;

  // Gate dimensions: 4m wide × 5m tall as per requirements
  const gateWidth = 4;
  const gateHeight = 5;
  const pillarWidth = 0.3;

  return (
    <RigidBody
      type="fixed"
      position={[gate.position.x, gate.position.y, gate.position.z]}
      sensor
      onIntersectionEnter={handleCollision}
      userData={{ type: 'gate', data: gate }}
    >
      <CuboidCollider args={[gateWidth / 2, gateHeight / 2, 0.5]} sensor />

      <group ref={groupRef}>
        {/* Gate frame - left pillar */}
        <mesh position={[-gateWidth / 2 + pillarWidth / 2, gateHeight / 2 - 1, 0]} castShadow>
          <boxGeometry args={[pillarWidth, gateHeight, pillarWidth]} />
          <meshStandardMaterial
            color={colors.primary}
            emissive={colors.glow}
            emissiveIntensity={0.4}
            metalness={0.6}
            roughness={0.4}
          />
        </mesh>

        {/* Gate frame - right pillar */}
        <mesh position={[gateWidth / 2 - pillarWidth / 2, gateHeight / 2 - 1, 0]} castShadow>
          <boxGeometry args={[pillarWidth, gateHeight, pillarWidth]} />
          <meshStandardMaterial
            color={colors.primary}
            emissive={colors.glow}
            emissiveIntensity={0.4}
            metalness={0.6}
            roughness={0.4}
          />
        </mesh>

        {/* Gate frame - top arch */}
        <mesh position={[0, gateHeight - 1, 0]} castShadow>
          <boxGeometry args={[gateWidth, pillarWidth * 1.5, pillarWidth]} />
          <meshStandardMaterial
            color={colors.secondary}
            emissive={colors.glow}
            emissiveIntensity={0.5}
            metalness={0.6}
            roughness={0.4}
          />
        </mesh>

        {/* Decorative top corners */}
        <mesh position={[-gateWidth / 2 + pillarWidth / 2, gateHeight - 0.5, 0]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshStandardMaterial color={colors.glow} emissive={colors.glow} emissiveIntensity={0.8} />
        </mesh>
        <mesh position={[gateWidth / 2 - pillarWidth / 2, gateHeight - 0.5, 0]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshStandardMaterial color={colors.glow} emissive={colors.glow} emissiveIntensity={0.8} />
        </mesh>

        {/* Gate portal effect */}
        <mesh ref={portalRef} position={[0, gateHeight / 2 - 0.5, 0]}>
          <planeGeometry args={[gateWidth - pillarWidth * 2, gateHeight - pillarWidth * 2]} />
          <meshStandardMaterial
            color={colors.primary}
            emissive={colors.glow}
            emissiveIntensity={0.5}
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Floating text showing gate effect */}
        <Text
          position={[0, gateHeight + 0.8, 0]}
          fontSize={0.6}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#000000"
        >
          {text}
        </Text>

        {/* Glow particles around gate */}
        {particles.map((pos, i) => (
          <mesh key={i} position={pos}>
            <sphereGeometry args={[0.05, 6, 6]} />
            <meshBasicMaterial color={colors.glow} transparent opacity={0.7} />
          </mesh>
        ))}

        {/* Upgrade indicator (when gate has been shot) */}
        {gate.upgradeLevel > 0 && (
          <group position={[0, gateHeight + 1.5, 0]}>
            {Array.from({ length: gate.upgradeLevel }, (_, i) => (
              <mesh key={i} position={[(i - (gate.upgradeLevel - 1) / 2) * 0.4, 0, 0]}>
                <sphereGeometry args={[0.15, 8, 8]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            ))}
          </group>
        )}
      </group>
    </RigidBody>
  );
}

// Render all gates from track section
interface GatesRendererProps {
  gates: GateState[];
  onCollect: (gate: GateState) => void;
}

export function GatesRenderer({ gates, onCollect }: GatesRendererProps) {
  return (
    <group>
      {gates.map((gate) => (
        <Gate key={gate.id} gate={gate} onCollect={onCollect} />
      ))}
    </group>
  );
}
