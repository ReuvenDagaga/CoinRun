// @ts-nocheck
// Legacy Army component - replaced by ArmyFollowers.tsx
import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/context';
import { COLORS } from '@/utils/constants';
import { playerPath, PathPoint } from './Player';
import { GAME_CONSTANTS } from '@shared/types/game.types';

interface SoldierData {
  id: number;
  position: THREE.Vector3;
  targetPosition: THREE.Vector3;
  animationOffset: number;
}

// Helper function to get position from path at a specific time delay
function getPositionAtDelay(delay: number): PathPoint | null {
  const targetTime = Date.now() - delay;

  // Find the closest path point to the target time
  if (playerPath.length === 0) return null;

  // Binary search for the closest timestamp
  let low = 0;
  let high = playerPath.length - 1;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (playerPath[mid].timestamp < targetTime) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  // Interpolate between two points for smoother movement
  if (low > 0 && low < playerPath.length) {
    const before = playerPath[low - 1];
    const after = playerPath[low];
    const t = (targetTime - before.timestamp) / (after.timestamp - before.timestamp);

    return {
      position: new THREE.Vector3().lerpVectors(before.position, after.position, Math.max(0, Math.min(1, t))),
      rotation: before.rotation.clone().slerp(after.rotation, Math.max(0, Math.min(1, t))),
      timestamp: targetTime
    };
  }

  return playerPath[low] || playerPath[playerPath.length - 1] || null;
}

export default function Army() {
  const groupRef = useRef<THREE.Group>(null);
  const { player, status } = useGame();

  // Soldier positions stored as refs for smooth animation
  const soldierPositions = useRef<Map<number, THREE.Vector3>>(new Map());

  // Generate soldier positions based on army count
  const soldiers = useMemo(() => {
    const result: SoldierData[] = [];
    const armyCount = Math.max(1, player.armyCount);

    for (let i = 0; i < armyCount; i++) {
      // Initialize position behind player
      const initialPos = new THREE.Vector3(
        player.position.x,
        0.3,
        player.position.z - (i + 1) * GAME_CONSTANTS.SOLDIER_SPACING
      );

      if (!soldierPositions.current.has(i)) {
        soldierPositions.current.set(i, initialPos.clone());
      }

      result.push({
        id: i,
        position: soldierPositions.current.get(i) || initialPos,
        targetPosition: initialPos.clone(),
        animationOffset: (i * 0.3) % (Math.PI * 2)
      });
    }

    return result;
  }, [player.armyCount, player.position]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    if (status !== 'playing' && status !== 'countdown' && status !== 'loading') return;

    const armyCount = Math.max(1, player.armyCount);
    const time = state.clock.elapsedTime;

    // Update each soldier's position based on the player's path
    for (let i = 0; i < armyCount; i++) {
      const delay = (i + 1) * GAME_CONSTANTS.SOLDIER_FOLLOW_DELAY;
      const targetPoint = getPositionAtDelay(delay);

      let currentPos = soldierPositions.current.get(i);
      if (!currentPos) {
        currentPos = new THREE.Vector3(player.position.x, 0.3, player.position.z - (i + 1) * GAME_CONSTANTS.SOLDIER_SPACING);
        soldierPositions.current.set(i, currentPos);
      }

      if (targetPoint) {
        // Smooth lerp to target position (snake-like following)
        const lerpSpeed = 8 * delta;
        currentPos.x = THREE.MathUtils.lerp(currentPos.x, targetPoint.position.x, lerpSpeed);
        currentPos.z = THREE.MathUtils.lerp(currentPos.z, targetPoint.position.z, lerpSpeed);
        currentPos.y = 0.3; // Keep at ground level
      } else {
        // Fallback: follow behind player in formation
        const fallbackX = player.position.x;
        const fallbackZ = player.position.z - (i + 1) * GAME_CONSTANTS.SOLDIER_SPACING;

        const lerpSpeed = 5 * delta;
        currentPos.x = THREE.MathUtils.lerp(currentPos.x, fallbackX, lerpSpeed);
        currentPos.z = THREE.MathUtils.lerp(currentPos.z, fallbackZ, lerpSpeed);
      }
    }
  });

  return (
    <group ref={groupRef}>
      {soldiers.map((soldier, index) => (
        <Soldier
          key={soldier.id}
          index={index}
          soldierPositions={soldierPositions}
          animationOffset={soldier.animationOffset}
        />
      ))}
    </group>
  );
}

interface SoldierProps {
  index: number;
  soldierPositions: React.MutableRefObject<Map<number, THREE.Vector3>>;
  animationOffset: number;
}

function Soldier({ index, soldierPositions, animationOffset }: SoldierProps) {
  const meshRef = useRef<THREE.Group>(null);
  const { player, status } = useGame();

  useFrame((state) => {
    if (!meshRef.current) return;

    const pos = soldierPositions.current.get(index);
    if (pos) {
      meshRef.current.position.copy(pos);
    } else {
      // Fallback position
      meshRef.current.position.set(
        player.position.x,
        0.3,
        player.position.z - (index + 1) * GAME_CONSTANTS.SOLDIER_SPACING
      );
    }

    // Bob animation
    const time = state.clock.elapsedTime + animationOffset;
    const bobY = status === 'playing' ? Math.sin(time * 8) * 0.05 : 0;
    meshRef.current.position.y = 0.3 + bobY;

    // Slight rotation for running effect
    meshRef.current.rotation.x = status === 'playing' ? Math.sin(time * 8) * 0.1 : 0;
  });

  return (
    <group ref={meshRef} position={[0, 0.3, 0]}>
      {/* Body */}
      <mesh castShadow>
        <capsuleGeometry args={[0.15, 0.25, 4, 8]} />
        <meshStandardMaterial
          color={COLORS.SOLDIER_COLOR}
          metalness={0.2}
          roughness={0.8}
        />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial
          color={COLORS.SOLDIER_HIGHLIGHT}
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>
    </group>
  );
}

// Instanced version for better performance with large armies - Snake following
export function ArmyInstanced() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { player, status } = useGame();

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const maxSoldiers = 130; // Max possible army size

  // Store soldier positions for smooth snake movement
  const soldierPositions = useRef<THREE.Vector3[]>([]);

  // Initialize soldier positions
  useEffect(() => {
    soldierPositions.current = [];
    for (let i = 0; i < maxSoldiers; i++) {
      soldierPositions.current.push(new THREE.Vector3(
        player.position.x,
        0.3,
        player.position.z - (i + 1) * GAME_CONSTANTS.SOLDIER_SPACING
      ));
    }
  }, []);

  // Initial setup - ensure army is visible immediately
  useEffect(() => {
    if (!meshRef.current) return;

    const armyCount = Math.max(1, player.armyCount);

    for (let i = 0; i < maxSoldiers; i++) {
      if (i < armyCount) {
        const pos = soldierPositions.current[i] || new THREE.Vector3(
          player.position.x,
          0.3,
          player.position.z - (i + 1) * GAME_CONSTANTS.SOLDIER_SPACING
        );

        dummy.position.copy(pos);
        dummy.rotation.x = 0;
        dummy.scale.setScalar(0.8);
      } else {
        dummy.scale.setScalar(0);
      }

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  // Update instances with snake-like following
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const isActive = status === 'playing' || status === 'countdown' || status === 'loading';
    if (!isActive) return;

    const armyCount = Math.max(1, player.armyCount);
    const time = state.clock.elapsedTime;

    for (let i = 0; i < maxSoldiers; i++) {
      if (i < armyCount) {
        // Get position from player path with delay
        const delay = (i + 1) * GAME_CONSTANTS.SOLDIER_FOLLOW_DELAY;
        const targetPoint = getPositionAtDelay(delay);

        let currentPos = soldierPositions.current[i];
        if (!currentPos) {
          currentPos = new THREE.Vector3(
            player.position.x,
            0.3,
            player.position.z - (i + 1) * GAME_CONSTANTS.SOLDIER_SPACING
          );
          soldierPositions.current[i] = currentPos;
        }

        if (targetPoint) {
          // Snake-like following with smooth interpolation
          const lerpSpeed = 8 * delta;
          currentPos.x = THREE.MathUtils.lerp(currentPos.x, targetPoint.position.x, lerpSpeed);
          currentPos.z = THREE.MathUtils.lerp(currentPos.z, targetPoint.position.z, lerpSpeed);
        } else {
          // Fallback: line behind player
          const fallbackX = player.position.x;
          const fallbackZ = player.position.z - (i + 1) * GAME_CONSTANTS.SOLDIER_SPACING;
          const lerpSpeed = 5 * delta;
          currentPos.x = THREE.MathUtils.lerp(currentPos.x, fallbackX, lerpSpeed);
          currentPos.z = THREE.MathUtils.lerp(currentPos.z, fallbackZ, lerpSpeed);
        }

        // Animation
        const animOffset = i * 0.3;
        const bobY = status === 'playing' ? Math.sin((time + animOffset) * 8) * 0.05 : 0;
        const rotX = status === 'playing' ? Math.sin((time + animOffset) * 8) * 0.1 : 0;

        dummy.position.set(currentPos.x, 0.3 + bobY, currentPos.z);
        dummy.rotation.x = rotX;
        dummy.scale.setScalar(0.8);
      } else {
        dummy.scale.setScalar(0);
      }

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, maxSoldiers]} castShadow>
      <capsuleGeometry args={[0.15, 0.25, 4, 8]} />
      <meshStandardMaterial
        color={COLORS.SOLDIER_COLOR}
        emissive={COLORS.SOLDIER_COLOR}
        emissiveIntensity={0.1}
        metalness={0.2}
        roughness={0.8}
      />
    </instancedMesh>
  );
}
