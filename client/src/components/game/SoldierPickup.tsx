import { useRef, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';

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
        y: 0.35, // Slightly above ground (smaller than player)
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

// Render all soldier pickups efficiently
export const SoldierPickups = memo(function SoldierPickups({
  soldiers,
  onCollect,
}: SoldierPickupsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const collectedSet = useRef<Set<string>>(new Set());

  const { player, status } = useGameStore();

  // Pre-calculate soldier positions for collision checking
  const activeSoldiers = useMemo(() => {
    return soldiers.filter((s) => !s.isCollected);
  }, [soldiers]);

  useFrame((state) => {
    if (!meshRef.current || status !== 'playing') return;

    const time = state.clock.elapsedTime;
    const playerX = player.position.x;
    const playerZ = player.position.z;

    activeSoldiers.forEach((soldier, index) => {
      // Skip if already collected this frame
      if (collectedSet.current.has(soldier.id)) return;

      // Distance check (2D - ignore Y)
      const dx = soldier.position.x - playerX;
      const dz = soldier.position.z - playerZ;
      const distSquared = dx * dx + dz * dz;

      // Collision radius (squared for performance)
      const collisionRadiusSq = 1.5 * 1.5;

      if (distSquared < collisionRadiusSq) {
        // Collected!
        collectedSet.current.add(soldier.id);
        onCollect(soldier.id);

        // Hide this soldier
        dummy.scale.setScalar(0);
      } else {
        // Bobbing animation
        const bobOffset = Math.sin(time * 3 + index * 0.5) * 0.1;
        dummy.position.set(
          soldier.position.x,
          soldier.position.y + bobOffset,
          soldier.position.z
        );

        // Gentle rotation
        dummy.rotation.y = time * 2 + index;

        // Scale pulse
        const scalePulse = 1 + Math.sin(time * 4 + index) * 0.05;
        dummy.scale.setScalar(scalePulse);
      }

      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(index, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  // Reset collected set when soldiers change
  useMemo(() => {
    collectedSet.current.clear();
  }, [soldiers]);

  if (activeSoldiers.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, activeSoldiers.length]}
      castShadow
    >
      {/* Soldier body - smaller capsule */}
      <capsuleGeometry args={[0.25, 0.4, 8, 12]} />
      <meshStandardMaterial
        color="#4169E1" // Blue color for soldiers
        metalness={0.4}
        roughness={0.6}
        emissive="#4169E1"
        emissiveIntensity={0.2}
      />
    </instancedMesh>
  );
});

// Single soldier pickup (alternative non-instanced version for low soldier counts)
interface SingleSoldierProps {
  soldier: SoldierPickupData;
  onCollect: (id: string) => void;
}

export const SingleSoldierPickup = memo(function SingleSoldierPickup({
  soldier,
  onCollect,
}: SingleSoldierProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const isCollected = useRef(false);

  const { player, status } = useGameStore();

  useFrame((state) => {
    if (!meshRef.current || isCollected.current || status !== 'playing') return;

    const time = state.clock.elapsedTime;

    // Check collision
    const dx = soldier.position.x - player.position.x;
    const dz = soldier.position.z - player.position.z;
    const distSquared = dx * dx + dz * dz;

    if (distSquared < 2.25) {
      // 1.5^2
      isCollected.current = true;
      onCollect(soldier.id);
      meshRef.current.visible = false;
      return;
    }

    // Bobbing animation
    const bobOffset = Math.sin(time * 3) * 0.1;
    meshRef.current.position.y = soldier.position.y + bobOffset;

    // Rotation
    meshRef.current.rotation.y = time * 2;
  });

  if (soldier.isCollected) return null;

  return (
    <mesh
      ref={meshRef}
      position={[soldier.position.x, soldier.position.y, soldier.position.z]}
      castShadow
    >
      <capsuleGeometry args={[0.25, 0.4, 8, 12]} />
      <meshStandardMaterial
        color="#4169E1"
        metalness={0.4}
        roughness={0.6}
        emissive="#4169E1"
        emissiveIntensity={0.2}
      />
    </mesh>
  );
});

export default SoldierPickups;
