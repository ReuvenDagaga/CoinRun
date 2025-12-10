import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import type { GateState } from '@shared/types/game.types';
import { GateType } from '@shared/types/game.types';
import { COLORS } from '@/utils/constants';

// Gate colors based on type
const GATE_COLORS: Record<GateType, string> = {
  [GateType.ADD]: COLORS.GATE_ADD,
  [GateType.MULTIPLY]: COLORS.GATE_MULTIPLY,
  [GateType.SPEED]: COLORS.GATE_SPEED,
  [GateType.SHIELD]: COLORS.GATE_SHIELD,
  [GateType.MAGNET]: COLORS.GATE_MAGNET,
  [GateType.BULLETS]: COLORS.GATE_BULLETS
};

// Gate display text
const getGateText = (type: GateType, value: number): string => {
  switch (type) {
    case GateType.ADD:
      return `+${value}`;
    case GateType.MULTIPLY:
      return `×${value}`;
    case GateType.SPEED:
      return '⚡ SPEED';
    case GateType.SHIELD:
      return '🛡️ SHIELD';
    case GateType.MAGNET:
      return '🧲 MAGNET';
    case GateType.BULLETS:
      return '🔫 BULLETS';
    default:
      return '';
  }
};

interface GateProps {
  gate: GateState;
  onCollect: (gate: GateState) => void;
}

export default function Gate({ gate, onCollect }: GateProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isCollected, setIsCollected] = useState(false);

  const color = GATE_COLORS[gate.type];
  const text = getGateText(gate.type, gate.value);

  // Animation
  useFrame((state) => {
    if (!meshRef.current || isCollected) return;

    // Pulsing glow effect
    const intensity = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.3;
    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    material.emissiveIntensity = intensity;

    // Subtle floating
    meshRef.current.position.y = gate.position.y + Math.sin(state.clock.elapsedTime * 2) * 0.1;
  });

  const handleCollision = () => {
    if (isCollected) return;
    setIsCollected(true);
    onCollect(gate);
  };

  if (isCollected) return null;

  return (
    <RigidBody
      type="fixed"
      position={[gate.position.x, gate.position.y, gate.position.z]}
      sensor
      onIntersectionEnter={handleCollision}
      userData={{ type: 'gate', data: gate }}
    >
      <CuboidCollider args={[1.5, 1.5, 0.3]} sensor />

      <group>
        {/* Gate frame - left pillar */}
        <mesh position={[-1.5, 0, 0]} castShadow>
          <boxGeometry args={[0.2, 3, 0.2]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.3}
            metalness={0.5}
            roughness={0.5}
          />
        </mesh>

        {/* Gate frame - right pillar */}
        <mesh position={[1.5, 0, 0]} castShadow>
          <boxGeometry args={[0.2, 3, 0.2]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.3}
            metalness={0.5}
            roughness={0.5}
          />
        </mesh>

        {/* Gate frame - top bar */}
        <mesh position={[0, 1.5, 0]} castShadow>
          <boxGeometry args={[3.2, 0.2, 0.2]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.3}
            metalness={0.5}
            roughness={0.5}
          />
        </mesh>

        {/* Gate portal effect */}
        <mesh ref={meshRef} position={[0, 0, 0]}>
          <planeGeometry args={[2.8, 2.8]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.5}
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Upgrade indicator (when gate has been shot) */}
        {gate.upgradeLevel > 0 && (
          <group position={[0, 2, 0]}>
            {Array.from({ length: gate.upgradeLevel }, (_, i) => (
              <mesh key={i} position={[(i - (gate.upgradeLevel - 1) / 2) * 0.3, 0, 0]}>
                <sphereGeometry args={[0.1, 8, 8]} />
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
