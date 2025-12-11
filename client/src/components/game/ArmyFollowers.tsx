import { useRef, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { playerPath, PathPoint } from './Player';
import { useGameStore } from '@/store/gameStore';

// Constants for army formation
const SOLDIER_SPACING = 1.5; // Distance between soldiers in the trail
const GROUND_Y = 0.35; // Soldier height (slightly lower than player)

interface ArmyFollowersProps {
  armySize: number; // Number of soldiers following
}

// Get position from path at a specific distance behind player
function getPositionAtDistance(
  currentPlayerZ: number,
  distanceBehind: number
): PathPoint | null {
  if (playerPath.length === 0) return null;

  const targetZ = currentPlayerZ - distanceBehind;

  // Find the closest path point to this Z position
  // Search from end (most recent) to beginning
  for (let i = playerPath.length - 1; i >= 0; i--) {
    if (playerPath[i].z <= targetZ) {
      // Found a point at or before our target
      // Interpolate between this point and the next for smoothness
      if (i < playerPath.length - 1) {
        const p1 = playerPath[i];
        const p2 = playerPath[i + 1];
        const t = (targetZ - p1.z) / (p2.z - p1.z || 1);

        return {
          x: p1.x + (p2.x - p1.x) * t,
          y: GROUND_Y,
          z: targetZ,
          timestamp: p1.timestamp + (p2.timestamp - p1.timestamp) * t,
        };
      }
      return { ...playerPath[i], y: GROUND_Y };
    }
  }

  // If no point found, return the oldest point
  return playerPath[0] ? { ...playerPath[0], y: GROUND_Y } : null;
}

// Army followers component using instanced mesh for performance
export const ArmyFollowers = memo(function ArmyFollowers({
  armySize,
}: ArmyFollowersProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Store soldier positions for smooth animation
  const soldierPositions = useRef<Array<{ x: number; y: number; z: number }>>(
    []
  );

  const { player, status } = useGameStore();

  // Initialize soldier positions
  useMemo(() => {
    soldierPositions.current = Array(armySize)
      .fill(null)
      .map(() => ({
        x: player.position.x,
        y: GROUND_Y,
        z: player.position.z - SOLDIER_SPACING,
      }));
  }, [armySize]);

  useFrame((state) => {
    if (!meshRef.current || armySize === 0) return;

    const time = state.clock.elapsedTime;

    // Update each soldier position
    for (let i = 0; i < armySize; i++) {
      // Calculate desired distance behind player
      const distanceBehind = (i + 1) * SOLDIER_SPACING;

      // Get target position from path
      const targetPos = getPositionAtDistance(player.position.z, distanceBehind);

      if (targetPos) {
        // Current position (with smoothing)
        const current = soldierPositions.current[i] || {
          x: targetPos.x,
          y: GROUND_Y,
          z: targetPos.z,
        };

        // Smooth interpolation toward target
        const smoothFactor = 0.15;
        current.x += (targetPos.x - current.x) * smoothFactor;
        current.z += (targetPos.z - current.z) * smoothFactor;
        current.y = GROUND_Y;

        soldierPositions.current[i] = current;

        // Update instance matrix
        dummy.position.set(current.x, current.y, current.z);

        // Running animation - bob and lean
        const bobOffset = Math.sin(time * 8 + i * 0.5) * 0.05;
        dummy.position.y += bobOffset;

        // Slight lean in movement direction
        dummy.rotation.z = Math.sin(time * 8 + i * 0.3) * 0.1;

        // Face forward
        dummy.rotation.y = 0;

        // Scale (uniform)
        dummy.scale.setScalar(0.7); // 70% of player size
      } else {
        // No path data yet - hide soldier
        dummy.scale.setScalar(0);
      }

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (armySize === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, Math.max(1, armySize)]}
      castShadow
    >
      {/* Soldier body - smaller capsule (same style as player but blue) */}
      <capsuleGeometry args={[0.25, 0.4, 8, 12]} />
      <meshStandardMaterial
        color="#4169E1" // Royal blue for soldiers
        metalness={0.3}
        roughness={0.7}
      />
    </instancedMesh>
  );
});

// Army count display component (optional HUD element)
export function ArmyCounter({ count }: { count: number }) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-lg">
      <span className="text-blue-400 text-xl font-bold">
        Army: {count}
      </span>
    </div>
  );
}

export default ArmyFollowers;
