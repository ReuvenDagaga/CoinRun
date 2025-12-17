import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/context';
import { STAIR_CONSTANTS } from '@shared/types/game.types';
import { TRACK_WIDTH } from '../Track/config';

// Stair colors - celebratory gradient
const STAIR_COLORS = [
  '#22c55e', // Green
  '#34d399', // Emerald
  '#2dd4bf', // Teal
  '#22d3ee', // Cyan
  '#38bdf8', // Sky
  '#60a5fa', // Blue
  '#818cf8', // Indigo
  '#a78bfa', // Violet
  '#c084fc', // Purple
  '#f472b6', // Pink
];

// Gold color for passed stairs
const GOLD_COLOR = '#FFD700';
const GOLD_EMISSIVE = '#FFA500';

interface StairsProps {
  showSoldiers?: boolean;
}

export default function Stairs({ showSoldiers = true }: StairsProps) {
  const { endGameState } = useGame();
  const groupRef = useRef<THREE.Group>(null);

  // Animate stairs entrance
  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;

    // Subtle floating animation for unreached stairs
    groupRef.current.children.forEach((child, index) => {
      if (child.userData.stairIndex !== undefined) {
        const stairData = endGameState?.stairs[child.userData.stairIndex];
        if (stairData && !stairData.isReached) {
          child.position.y = stairData.position.y + Math.sin(time * 2 + index * 0.3) * 0.05;
        }
      }
    });
  });

  const stairs = useMemo(() => {
    return Array.from({ length: STAIR_CONSTANTS.TOTAL_STAIRS }, (_, index) => {
      const z = STAIR_CONSTANTS.STAIRS_START_Z + index * (STAIR_CONSTANTS.STAIR_DEPTH + STAIR_CONSTANTS.STAIR_GAP);
      const y = index * STAIR_CONSTANTS.STAIR_HEIGHT;
      const color = STAIR_COLORS[index];

      return {
        index,
        position: { x: 0, y, z },
        color,
        number: index + 1,
      };
    });
  }, []);

  return (
    <group ref={groupRef}>
      {stairs.map((stair) => {
        const stairData = endGameState?.stairs[stair.index];
        const isReached = stairData?.isReached || false;
        const soldiersOnStair = stairData?.soldiersOnStair || 0;

        return (
          <SingleStair
            key={stair.index}
            {...stair}
            isReached={isReached}
            soldiersOnStair={soldiersOnStair}
            showSoldiers={showSoldiers}
          />
        );
      })}
    </group>
  );
}

interface SingleStairProps {
  index: number;
  position: { x: number; y: number; z: number };
  color: string;
  number: number;
  isReached: boolean;
  soldiersOnStair: number;
  showSoldiers: boolean;
}

function SingleStair({
  index,
  position,
  color,
  number,
  isReached,
  soldiersOnStair,
  showSoldiers,
}: SingleStairProps) {
  const stairRef = useRef<THREE.Group>(null);

  // Use gold color for reached stairs
  const stairColor = isReached ? GOLD_COLOR : color;
  const emissiveColor = isReached ? GOLD_EMISSIVE : color;
  const emissiveIntensity = isReached ? 0.4 : 0.15;

  return (
    <group
      ref={stairRef}
      position={[position.x, position.y, position.z]}
      userData={{ stairIndex: index }}
    >
      {/* Main stair platform */}
      <mesh position={[0, STAIR_CONSTANTS.STAIR_HEIGHT / 2, 0]}>
        <boxGeometry
          args={[
            STAIR_CONSTANTS.STAIR_WIDTH,
            STAIR_CONSTANTS.STAIR_HEIGHT,
            STAIR_CONSTANTS.STAIR_DEPTH,
          ]}
        />
        <meshStandardMaterial
          color={stairColor}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          metalness={isReached ? 0.6 : 0.3}
          roughness={isReached ? 0.2 : 0.4}
        />
      </mesh>

      {/* Stair front face with number */}
      <mesh position={[0, STAIR_CONSTANTS.STAIR_HEIGHT / 2, -STAIR_CONSTANTS.STAIR_DEPTH / 2 - 0.01]}>
        <planeGeometry args={[3, STAIR_CONSTANTS.STAIR_HEIGHT - 0.2]} />
        <meshStandardMaterial
          color={isReached ? '#1a1a1a' : '#ffffff'}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Number indicator (3D text representation) */}
      <NumberDisplay
        number={number}
        position={[0, STAIR_CONSTANTS.STAIR_HEIGHT / 2, -STAIR_CONSTANTS.STAIR_DEPTH / 2 + 0.01]}
        isReached={isReached}
      />

      {/* Side rails */}
      <mesh position={[-STAIR_CONSTANTS.STAIR_WIDTH / 2 + 0.1, STAIR_CONSTANTS.STAIR_HEIGHT + 0.3, 0]}>
        <boxGeometry args={[0.2, 0.6, STAIR_CONSTANTS.STAIR_DEPTH + 0.4]} />
        <meshStandardMaterial
          color={isReached ? GOLD_COLOR : '#8B4513'}
          metalness={isReached ? 0.7 : 0.3}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[STAIR_CONSTANTS.STAIR_WIDTH / 2 - 0.1, STAIR_CONSTANTS.STAIR_HEIGHT + 0.3, 0]}>
        <boxGeometry args={[0.2, 0.6, STAIR_CONSTANTS.STAIR_DEPTH + 0.4]} />
        <meshStandardMaterial
          color={isReached ? GOLD_COLOR : '#8B4513'}
          metalness={isReached ? 0.7 : 0.3}
          roughness={0.4}
        />
      </mesh>

      {/* Soldiers on stair (simple representation) */}
      {showSoldiers && isReached && soldiersOnStair > 0 && (
        <SoldiersOnStair count={soldiersOnStair} stairWidth={STAIR_CONSTANTS.STAIR_WIDTH} />
      )}

      {/* Cost indicator below stair (only for unreached stairs) */}
      {!isReached && (
        <CostIndicator
          cost={STAIR_CONSTANTS.STAIR_COSTS[index]}
          position={[0, -0.3, 0]}
        />
      )}
    </group>
  );
}

// Number display for stair
interface NumberDisplayProps {
  number: number;
  position: [number, number, number];
  isReached: boolean;
}

function NumberDisplay({ number, position, isReached }: NumberDisplayProps) {
  const color = isReached ? GOLD_COLOR : '#333333';

  // Create number using simple 3D boxes
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={isReached ? GOLD_EMISSIVE : '#000'}
          emissiveIntensity={isReached ? 0.5 : 0}
        />
      </mesh>
      {/* Number text would be added here with @react-three/drei Text component */}
      {/* For now, using sphere as placeholder */}
    </group>
  );
}

// Soldiers on stair representation
interface SoldiersOnStairProps {
  count: number;
  stairWidth: number;
}

function SoldiersOnStair({ count, stairWidth }: SoldiersOnStairProps) {
  // Limit visual soldiers to prevent performance issues
  const visualCount = Math.min(count, 20);
  const rows = Math.ceil(visualCount / 5);

  return (
    <group position={[0, STAIR_CONSTANTS.STAIR_HEIGHT + 0.5, 0]}>
      {Array.from({ length: visualCount }, (_, i) => {
        const row = Math.floor(i / 5);
        const col = i % 5;
        const x = (col - 2) * 1.2;
        const z = row * 1.0;

        return (
          <mesh key={i} position={[x, 0, z]}>
            <capsuleGeometry args={[0.2, 0.6, 4, 8]} />
            <meshStandardMaterial
              color="#4a90d9"
              emissive="#2a5090"
              emissiveIntensity={0.2}
            />
          </mesh>
        );
      })}
      {/* Show count badge if more than visual soldiers */}
      {count > visualCount && (
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial color="#FF4444" emissive="#FF0000" emissiveIntensity={0.5} />
        </mesh>
      )}
    </group>
  );
}

// Cost indicator
interface CostIndicatorProps {
  cost: number;
  position: [number, number, number];
}

function CostIndicator({ cost, position }: CostIndicatorProps) {
  return (
    <group position={position}>
      {/* Background pill */}
      <mesh>
        <capsuleGeometry args={[0.4, 1.2, 4, 8]} />
        <meshStandardMaterial
          color="#333333"
          transparent
          opacity={0.8}
        />
      </mesh>
      {/* Soldier icon */}
      <mesh position={[0, 0.3, 0.3]}>
        <capsuleGeometry args={[0.15, 0.3, 4, 8]} />
        <meshStandardMaterial color="#4a90d9" />
      </mesh>
    </group>
  );
}
