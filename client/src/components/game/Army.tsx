import { useRef, useMemo, useEffect } from 'react';
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
    const armyCount = Math.max(1, player.armyCount); // Ensure at least 1 soldier

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

  // Initial position setup
  useEffect(() => {
    if (groupRef.current) {
      const playerPos = player.position;
      groupRef.current.position.set(playerPos.x, 0, playerPos.z);
    }
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Army should be visible and follow player during countdown and playing
    if (status === 'playing' || status === 'countdown' || status === 'loading') {
      const playerPos = player.position;
      groupRef.current.position.set(playerPos.x, 0, playerPos.z);
    }
  });

  // Don't hide army - always render it
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

  // Initial setup - ensure army is visible immediately
  useEffect(() => {
    if (!meshRef.current) return;

    const armyCount = Math.max(1, player.armyCount);
    const columns = 4;
    const spacing = 0.8;

    for (let i = 0; i < maxSoldiers; i++) {
      if (i < armyCount) {
        const col = i % columns;
        const row = Math.floor(i / columns);

        const offsetX = (col - (columns - 1) / 2) * spacing;
        const offsetZ = -(row + 1) * spacing * 1.2;

        dummy.position.set(
          player.position.x + offsetX,
          0.3,
          player.position.z + offsetZ
        );
        dummy.rotation.x = 0;
        dummy.scale.setScalar(0.8); // 0.8x scale as per requirements
      } else {
        dummy.scale.setScalar(0);
      }

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  // Update instances - visible during countdown AND playing
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Army should ALWAYS be visible during countdown and playing
    const isActive = status === 'playing' || status === 'countdown' || status === 'loading';
    if (!isActive) return;

    const armyCount = Math.max(1, player.armyCount);
    const columns = 4;
    const spacing = 0.8;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < maxSoldiers; i++) {
      if (i < armyCount) {
        const col = i % columns;
        const row = Math.floor(i / columns);

        const offsetX = (col - (columns - 1) / 2) * spacing;
        const offsetZ = -(row + 1) * spacing * 1.2;

        // Animation - only animate during gameplay
        const animOffset = i * 0.5;
        const bobY = status === 'playing' ? Math.sin((time + animOffset) * 8) * 0.05 : 0;
        const rotX = status === 'playing' ? Math.sin((time + animOffset) * 8) * 0.1 : 0;

        dummy.position.set(
          player.position.x + offsetX,
          0.3 + bobY,
          player.position.z + offsetZ
        );
        dummy.rotation.x = rotX;
        dummy.scale.setScalar(0.8); // 0.8x scale as per requirements
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
        emissive={COLORS.SOLDIER_COLOR}
        emissiveIntensity={0.1}
        metalness={0.2}
        roughness={0.8}
      />
    </instancedMesh>
  );
}
