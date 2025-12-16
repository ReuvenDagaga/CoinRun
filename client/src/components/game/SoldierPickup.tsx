import { useRef, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/context';
import { useAuth } from '@/hooks/useAuth';
import { CharacterModel } from './characters';
import { GROUND_Y } from './Player';

export interface SoldierPickupData {
  id: string;
  position: { x: number; y: number; z: number };
  isCollected: boolean;
}

export function generateSoldiers(trackLength: number = 800): SoldierPickupData[] {
  const soldiers: SoldierPickupData[] = [];

  for (let z = 50; z < trackLength - 50; z += 50) {
    soldiers.push({
      id: `soldier-${z}`,
      position: {
        x: (Math.random() - 0.5) * 8,
        y: GROUND_Y,
        z: z + (Math.random() - 0.5) * 20,
      },
      isCollected: false,
    });
  }

  return soldiers;
}

interface SoldierPickupsProps {
  soldiers: SoldierPickupData[];
  onCollect: (id: string) => void;
}

interface SingleSoldierProps {
  soldier: SoldierPickupData;
  onCollect: (id: string) => void;
  skinId: string;
}

const SingleSoldier = memo(function SingleSoldier({
  soldier,
  onCollect,
  skinId,
}: SingleSoldierProps) {
  const groupRef = useRef<THREE.Group>(null);
  const isCollectedRef = useRef(false);

  const { player, status } = useGame();

  useFrame((state) => {
    if (!groupRef.current || isCollectedRef.current || status !== 'playing') return;

    const dx = soldier.position.x - player.position.x;
    const dz = soldier.position.z - player.position.z;
    const distSquared = dx * dx + dz * dz;

    if (distSquared < 2.25) {
      isCollectedRef.current = true;
      onCollect(soldier.id);
      return;
    }

    const bobOffset = Math.sin(state.clock.elapsedTime * 2) * 0.05;
    groupRef.current.position.y = soldier.position.y + bobOffset;
  });

  if (soldier.isCollected) return null;

  return (
    <group
      ref={groupRef}
      position={[soldier.position.x, soldier.position.y, soldier.position.z]}
    >
      <CharacterModel
        skinId={skinId}
        animation="idle"
        scale={1}
      />
    </group>
  );
});

export const SoldierPickups = memo(function SoldierPickups({
  soldiers,
  onCollect,
}: SoldierPickupsProps) {
  const { user } = useAuth();

  const currentSkin = user?.currentSkin || user?.ownedSkins?.[0] || 'default';

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
          skinId={currentSkin}
        />
      ))}
    </group>
  );
});

export default SoldierPickups;