import { useRef, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/context';
import CharacterModel, { PLAYER_COLOR } from './CharacterModel';
import { GROUND_Y } from './Player';

// Lerp helper for smooth movement
function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

// Formation constants
const SOLDIERS_PER_ROW = 3;
const SPACING_X = 1.2; // Horizontal spacing between soldiers
const SPACING_Z = 1.5; // Vertical spacing between rows
const BACK_OFFSET = -2.0; // Distance behind player for first row

// Calculate formation position for a soldier at given index
function getFormationPosition(
  index: number,
  playerX: number,
  playerZ: number
): { x: number; y: number; z: number } {
  // Formation: Grid behind player
  //   3  4  5   ← Row 2 (back)
  //   0  1  2   ← Row 1 (behind player)
  //     P       ← Player

  const row = Math.floor(index / SOLDIERS_PER_ROW);
  const col = index % SOLDIERS_PER_ROW;

  // Center the row (for 3 soldiers: -1, 0, +1)
  const xOffset = (col - (SOLDIERS_PER_ROW - 1) / 2) * SPACING_X;
  const zOffset = BACK_OFFSET - row * SPACING_Z;

  return {
    x: playerX + xOffset,
    y: GROUND_Y,
    z: playerZ + zOffset,
  };
}

// Single army soldier with smooth movement
const ArmySoldier = memo(function ArmySoldier({
  index,
  playerX,
  playerZ,
}: {
  index: number;
  playerX: number;
  playerZ: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  // Store current position for smooth interpolation
  const currentPos = useRef({
    x: playerX,
    y: GROUND_Y,
    z: playerZ + BACK_OFFSET - Math.floor(index / SOLDIERS_PER_ROW) * SPACING_Z,
  });

  useFrame((state) => {
    if (!groupRef.current) return;

    // Calculate target formation position
    const target = getFormationPosition(index, playerX, playerZ);

    // Smooth interpolation to target position
    const smoothFactor = 0.12; // Lower = smoother but more lag
    currentPos.current.x = lerp(currentPos.current.x, target.x, smoothFactor);
    currentPos.current.z = lerp(currentPos.current.z, target.z, smoothFactor);
    currentPos.current.y = GROUND_Y;

    // Update position
    groupRef.current.position.set(
      currentPos.current.x,
      currentPos.current.y,
      currentPos.current.z
    );

    // Running animation - subtle bob
    const bobOffset = Math.sin(state.clock.elapsedTime * 8 + index * 0.5) * 0.03;
    groupRef.current.position.y += bobOffset;

    // Slight sway while running
    groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 8 + index * 0.3) * 0.05;
  });

  return (
    <group ref={groupRef} position={[currentPos.current.x, GROUND_Y, currentPos.current.z]}>
      {/* IDENTICAL to player - same CharacterModel, same color */}
      <CharacterModel color={PLAYER_COLOR} />
    </group>
  );
});

// Main Army component - renders all collected soldiers in GROUP formation
interface ArmyFollowersProps {
  armySize: number; // Number of soldiers following (NOT including player)
}

export const ArmyFollowers = memo(function ArmyFollowers({
  armySize,
}: ArmyFollowersProps) {
  const { player, status } = useGame();

  // Don't render if no army or game not active
  if (armySize <= 0) return null;
  if (status !== 'playing' && status !== 'countdown' && status !== 'finished') return null;

  return (
    <group>
      {Array.from({ length: armySize }).map((_, index) => (
        <ArmySoldier
          key={`army-soldier-${index}`}
          index={index}
          playerX={player.position.x}
          playerZ={player.position.z}
        />
      ))}
    </group>
  );
});

export default ArmyFollowers;
