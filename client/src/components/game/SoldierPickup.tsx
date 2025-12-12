import { useRef, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/context';
import CharacterModel, { PLAYER_COLOR } from './CharacterModel';
import { GROUND_Y } from './Player';

// Soldier pickup interface
export interface SoldierPickupData {
  id: string;
  position: { x: number; y: number; z: number };
  isCollected: boolean;
}

// Generate soldiers along the track
export function generateSoldiers(trackLength: number = 800): SoldierPickupData[] {
  const soldiers: SoldierPickupData[] = [];

  // Spawn soldier every ~50m with some randomization
  for (let z = 50; z < trackLength - 50; z += 50) {
    soldiers.push({
      id: `soldier-${z}`,
      position: {
        x: (Math.random() - 0.5) * 8, // Random X within track bounds (-4 to 4)
        y: GROUND_Y, // Same height as player
        z: z + (Math.random() - 0.5) * 20, // Some Z randomization
      },
      isCollected: false,
    });
  }

  return soldiers;
}

// Props for the SoldierPickups renderer
interface SoldierPickupsProps {
  soldiers: SoldierPickupData[];
  onCollect: (id: string) => void;
}

// Single soldier pickup component - IDENTICAL to player
const SingleSoldier = memo(function SingleSoldier({
  soldier,
  onCollect,
}: {
  soldier: SoldierPickupData;
  onCollect: (id: string) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const isCollectedRef = useRef(false);

  const { player, status } = useGame();

  useFrame((state) => {
    if (!groupRef.current || isCollectedRef.current || status !== 'playing') return;

    // Distance check (2D - ignore Y for more forgiving collision)
    const dx = soldier.position.x - player.position.x;
    const dz = soldier.position.z - player.position.z;
    const distSquared = dx * dx + dz * dz;

    // Collision radius squared (1.5^2 = 2.25)
    if (distSquared < 2.25) {
      isCollectedRef.current = true;
      onCollect(soldier.id);
      return;
    }

    // Gentle bobbing animation (subtle, not flickering)
    const bobOffset = Math.sin(state.clock.elapsedTime * 2) * 0.05;
    groupRef.current.position.y = soldier.position.y + bobOffset;
  });

  // Don't render if collected
  if (soldier.isCollected) return null;

  return (
    <group
      ref={groupRef}
      position={[soldier.position.x, soldier.position.y, soldier.position.z]}
    >
      {/* IDENTICAL to player - same CharacterModel, same color */}
      <CharacterModel color={PLAYER_COLOR} />
    </group>
  );
});

// Render all soldier pickups
export const SoldierPickups = memo(function SoldierPickups({
  soldiers,
  onCollect,
}: SoldierPickupsProps) {
  // Filter out collected soldiers
  const activeSoldiers = useMemo(() => {
    return soldiers.filter((s) => !s.isCollected);
  }, [soldiers]);

  return (
    <group>
      {activeSoldiers.map((soldier) => (
        <SingleSoldier
          key={soldier.id}
          soldier={soldier}
          onCollect={onCollect}
        />
      ))}
    </group>
  );
});

export default SoldierPickups;
