import { useRef, memo, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { useGameStore } from '@/store/gameStore';
import {
  SimpleGateType,
  GateData,
  GATE_CONFIGS,
  GATE_WIDTH,
  GATE_HEIGHT,
} from './gateTypes';
import { GROUND_Y } from './Player';

// Gate frame dimensions
const FRAME_THICKNESS = 0.3;
const BORDER_THICKNESS = 0.15;

// Army formation constants (must match ArmyFollowers.tsx)
const SOLDIERS_PER_ROW = 3;
const SPACING_X = 1.2;
const SPACING_Z = 1.5;
const BACK_OFFSET = -2.0;

// Calculate formation position for a soldier at given index
function getArmyPosition(
  index: number,
  playerX: number,
  playerZ: number
): { x: number; z: number } {
  const row = Math.floor(index / SOLDIERS_PER_ROW);
  const col = index % SOLDIERS_PER_ROW;
  const xOffset = (col - (SOLDIERS_PER_ROW - 1) / 2) * SPACING_X;
  const zOffset = BACK_OFFSET - row * SPACING_Z;

  return {
    x: playerX + xOffset,
    z: playerZ + zOffset,
  };
}

// Single Gate component
interface GateProps {
  gate: GateData;
  onTrigger: (gateId: string, gateType: SimpleGateType) => void;
  armySize: number;
}

const SingleGate = memo(function SingleGate({ gate, onTrigger, armySize }: GateProps) {
  const groupRef = useRef<THREE.Group>(null);
  const innerFillRef = useRef<THREE.Mesh>(null);
  const isTriggeredRef = useRef(false);

  const { player, status } = useGameStore();
  const config = GATE_CONFIGS[gate.type];

  // Frame material (bright colored, glowing)
  const frameMaterial = useMemo(
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

  // Border material (black)
  const borderMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#000000',
      }),
    []
  );

  // Inner fill material (70% transparent)
  const fillMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: config.color,
        transparent: true,
        opacity: 0.3, // 70% transparent
        side: THREE.DoubleSide,
      }),
    [config.color]
  );

  useFrame((state) => {
    if (!groupRef.current || isTriggeredRef.current || status !== 'playing') return;

    const gateX = gate.position.x;
    const gateZ = gate.position.z;
    const playerX = player.position.x;
    const playerZ = player.position.z;

    // Helper function to check if a position triggers the gate
    const checkCollision = (posX: number, posZ: number): boolean => {
      const distX = Math.abs(posX - gateX);
      const distZ = Math.abs(posZ - gateZ);
      return distX < GATE_WIDTH / 2 && distZ < 1.5;
    };

    // Check main player collision first
    if (checkCollision(playerX, playerZ)) {
      isTriggeredRef.current = true;
      onTrigger(gate.id, gate.type);
      return;
    }

    // Check ALL army soldiers for collision
    for (let i = 0; i < armySize; i++) {
      const soldierPos = getArmyPosition(i, playerX, playerZ);
      if (checkCollision(soldierPos.x, soldierPos.z)) {
        isTriggeredRef.current = true;
        onTrigger(gate.id, gate.type);
        return;
      }
    }

    // Gentle pulse animation for fill
    if (innerFillRef.current) {
      const time = state.clock.elapsedTime;
      const pulse = 0.25 + Math.sin(time * 3) * 0.1;
      (innerFillRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
    }
  });

  // Don't render if triggered
  if (gate.isTriggered) return null;

  const baseY = GROUND_Y;
  const halfWidth = GATE_WIDTH / 2;
  const halfHeight = GATE_HEIGHT / 2;

  return (
    <group
      ref={groupRef}
      position={[gate.position.x, 0, gate.position.z]}
    >
      {/* === OUTER BORDER (Black) === */}
      {/* Left Border */}
      <mesh position={[-(halfWidth + BORDER_THICKNESS / 2), baseY + halfHeight, 0]} material={borderMaterial}>
        <boxGeometry args={[BORDER_THICKNESS, GATE_HEIGHT + BORDER_THICKNESS * 2, 0.1]} />
      </mesh>
      {/* Right Border */}
      <mesh position={[halfWidth + BORDER_THICKNESS / 2, baseY + halfHeight, 0]} material={borderMaterial}>
        <boxGeometry args={[BORDER_THICKNESS, GATE_HEIGHT + BORDER_THICKNESS * 2, 0.1]} />
      </mesh>
      {/* Top Border */}
      <mesh position={[0, baseY + GATE_HEIGHT + BORDER_THICKNESS / 2, 0]} material={borderMaterial}>
        <boxGeometry args={[GATE_WIDTH + BORDER_THICKNESS * 2, BORDER_THICKNESS, 0.1]} />
      </mesh>
      {/* Bottom Border */}
      <mesh position={[0, baseY - BORDER_THICKNESS / 2, 0]} material={borderMaterial}>
        <boxGeometry args={[GATE_WIDTH + BORDER_THICKNESS * 2, BORDER_THICKNESS, 0.1]} />
      </mesh>

      {/* === FRAME (Bright Colored, Glowing) === */}
      {/* Left Pillar */}
      <mesh position={[-halfWidth + FRAME_THICKNESS / 2, baseY + halfHeight, 0]} material={frameMaterial} castShadow>
        <boxGeometry args={[FRAME_THICKNESS, GATE_HEIGHT, 0.2]} />
      </mesh>
      {/* Right Pillar */}
      <mesh position={[halfWidth - FRAME_THICKNESS / 2, baseY + halfHeight, 0]} material={frameMaterial} castShadow>
        <boxGeometry args={[FRAME_THICKNESS, GATE_HEIGHT, 0.2]} />
      </mesh>
      {/* Top Bar */}
      <mesh position={[0, baseY + GATE_HEIGHT - FRAME_THICKNESS / 2, 0]} material={frameMaterial} castShadow>
        <boxGeometry args={[GATE_WIDTH, FRAME_THICKNESS, 0.2]} />
      </mesh>

      {/* === INNER FILL (70% Transparent) === */}
      <mesh
        ref={innerFillRef}
        position={[0, baseY + halfHeight, 0]}
        material={fillMaterial}
      >
        <planeGeometry args={[GATE_WIDTH - FRAME_THICKNESS * 2, GATE_HEIGHT - FRAME_THICKNESS * 2]} />
      </mesh>

      {/* === TEXT - Center of Gate === */}
      {/* Text rotated 180° around Y to face player (who runs toward +Z) */}
      <Text
        position={[0, baseY + halfHeight, 0.15]}
        fontSize={0.55}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.06}
        outlineColor="#000000"
        rotation={[0, Math.PI, 0]} // Rotated 180° to face player
      >
        {config.label}
      </Text>

      {/* === GROUND INDICATOR === */}
      <mesh
        position={[0, 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[GATE_WIDTH, 1.5]} />
        <meshBasicMaterial
          color={config.color}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* === GLOW LIGHTS === */}
      <pointLight
        position={[0, baseY + halfHeight, 0.5]}
        color={config.color}
        intensity={1}
        distance={6}
      />
    </group>
  );
});

// Gates renderer - renders all gates
interface GatesProps {
  gates: GateData[];
  onGateTrigger: (gateId: string, gateType: SimpleGateType) => void;
  armySize: number; // Number of soldiers following (NOT including player)
}

export const GatesRenderer = memo(function GatesRenderer({
  gates,
  onGateTrigger,
  armySize,
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
          armySize={armySize}
        />
      ))}
    </group>
  );
});

export default GatesRenderer;
