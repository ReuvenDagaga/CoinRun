import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { COLORS } from '@/utils/constants';

interface SoldierData {
  id: number;
  offsetX: number;
  offsetZ: number;
  animationOffset: number;
}

export default function Army() {
  const groupRef = useRef<THREE.Group>(null);
  const { player, status } = useGameStore();

  // Generate soldier positions based on army count
  const soldiers = useMemo(() => {
    const result: SoldierData[] = [];
    const armyCount = player.armyCount;

    // Formation: 4 columns, rows stacking behind player
    const columns = 4;
    const spacing = 0.8;

    for (let i = 0; i < armyCount; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);

      // Center the columns
      const offsetX = (col - (columns - 1) / 2) * spacing;
      const offsetZ = -(row + 1) * spacing * 1.2; // Behind the player

      result.push({
        id: i,
        offsetX,
        offsetZ,
        animationOffset: Math.random() * Math.PI * 2 // Random animation phase
      });
    }

    return result;
  }, [player.armyCount]);

  useFrame((state, delta) => {
    if (!groupRef.current || status !== 'playing') return;

    // Follow player position
    const playerPos = player.position;
    groupRef.current.position.set(playerPos.x, 0, playerPos.z);
  });

  return (
    <group ref={groupRef}>
      {soldiers.map((soldier) => (
        <Soldier
          key={soldier.id}
          offsetX={soldier.offsetX}
          offsetZ={soldier.offsetZ}
          animationOffset={soldier.animationOffset}
        />
      ))}
    </group>
  );
}

interface SoldierProps {
  offsetX: number;
  offsetZ: number;
  animationOffset: number;
}

function Soldier({ offsetX, offsetZ, animationOffset }: SoldierProps) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!meshRef.current) return;

    // Bob animation
    const time = state.clock.elapsedTime + animationOffset;
    meshRef.current.position.y = 0.3 + Math.sin(time * 8) * 0.05;

    // Slight rotation for running effect
    meshRef.current.rotation.x = Math.sin(time * 8) * 0.1;
  });

  return (
    <group ref={meshRef} position={[offsetX, 0.3, offsetZ]}>
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

// Instanced version for better performance with large armies
export function ArmyInstanced() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { player, status } = useGameStore();

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const maxSoldiers = 130; // Max possible army size

  // Update instances
  useFrame((state, delta) => {
    if (!meshRef.current || status !== 'playing') return;

    const armyCount = player.armyCount;
    const columns = 4;
    const spacing = 0.8;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < maxSoldiers; i++) {
      if (i < armyCount) {
        const col = i % columns;
        const row = Math.floor(i / columns);

        const offsetX = (col - (columns - 1) / 2) * spacing;
        const offsetZ = -(row + 1) * spacing * 1.2;

        // Animation
        const animOffset = i * 0.5;
        const bobY = Math.sin((time + animOffset) * 8) * 0.05;

        dummy.position.set(
          player.position.x + offsetX,
          0.3 + bobY,
          player.position.z + offsetZ
        );
        dummy.rotation.x = Math.sin((time + animOffset) * 8) * 0.1;
        dummy.scale.setScalar(1);
      } else {
        // Hide unused soldiers
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
        metalness={0.2}
        roughness={0.8}
      />
    </instancedMesh>
  );
}
