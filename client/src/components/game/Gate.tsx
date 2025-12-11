import { useRef, useState, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { GateState } from '@shared/types/game.types';
import { GateType } from '@shared/types/game.types';
import { COLORS } from '@/utils/constants';
import { useGameStore } from '@/store/gameStore';

// Performance constants
const RENDER_DISTANCE = 100;
const DETAIL_DISTANCE = 50;

// Gate colors based on type - BRIGHT CASUAL STYLE (Brawl Stars)
const GATE_COLORS: Record<GateType, { primary: string; secondary: string; glow: string }> = {
  [GateType.ADD]: {
    primary: '#32CD32',    // Lime Green
    secondary: '#228B22',
    glow: '#98FB98'
  },
  [GateType.MULTIPLY]: {
    primary: '#00BFFF',    // Electric Blue
    secondary: '#0080FF',
    glow: '#87CEFA'
  },
  [GateType.SPEED]: {
    primary: '#FFD700',    // Gold
    secondary: '#FFA500',
    glow: '#FFFF00'
  },
  [GateType.SHIELD]: {
    primary: '#9370DB',    // Medium Purple
    secondary: '#8A2BE2',
    glow: '#DDA0DD'
  },
  [GateType.MAGNET]: {
    primary: '#FF69B4',    // Hot Pink
    secondary: '#FF1493',
    glow: '#FFB6C1'
  },
  [GateType.BULLETS]: {
    primary: '#DC143C',    // Crimson
    secondary: '#8B0000',
    glow: '#FF6B6B'
  }
};

// Gate display text - More descriptive for clarity
const getGateText = (type: GateType, value: number): string => {
  switch (type) {
    case GateType.ADD:
      return `+${value} SOLDIERS`;
    case GateType.MULTIPLY:
      return `x${value} ARMY!`;
    case GateType.SPEED:
      return 'SPEED BOOST!';
    case GateType.SHIELD:
      return 'INVINCIBLE!';
    case GateType.MAGNET:
      return 'COIN MAGNET!';
    case GateType.BULLETS:
      return 'POWER SHOTS!';
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

  // Gate dimensions: 6m wide × 6m tall for better visibility
  const gateWidth = 6;
  const gateHeight = 6;
  const pillarWidth = 0.4;

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

        {/* Floating text showing gate effect - Large and prominent */}
        <Text
          position={[0, gateHeight + 1.2, 0]}
          fontSize={0.8}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.08}
          outlineColor="#000000"
        >
          {text}
        </Text>

        {/* Icon display in center of gate */}
        <Text
          position={[0, gateHeight / 2, 0.1]}
          fontSize={2.5}
          color={colors.glow}
          anchorX="center"
          anchorY="middle"
        >
          {getGateIcon(gate.type)}
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

// Optimized gates renderer with distance culling
interface GatesRendererProps {
  gates: GateState[];
  onCollect: (gate: GateState) => void;
}

export const GatesRenderer = memo(function GatesRenderer({ gates, onCollect }: GatesRendererProps) {
  const { player } = useGameStore();

  // Filter gates by render distance
  const visibleGates = useMemo(() => {
    return gates.filter(gate => {
      if (gate.isCollected) return false;
      const dist = Math.abs(gate.position.z - player.position.z);
      return dist < RENDER_DISTANCE;
    });
  }, [gates, player.position.z]);

  return (
    <group>
      {visibleGates.map((gate) => (
        <Gate key={gate.id} gate={gate} onCollect={onCollect} />
      ))}
    </group>
  );
});
