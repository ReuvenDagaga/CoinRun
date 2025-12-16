import { useRef, memo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/context';
import { useAuth } from '@/hooks/useAuth';
import { CharacterModel, CharacterModelRef } from './characters';
import { GROUND_Y, getAnimationFromSpeed } from './Player';

// Maximum soldiers to add per frame to prevent freeze
const MAX_SOLDIERS_PER_FRAME = 5;

function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

const SOLDIERS_PER_ROW = 3;
const SPACING_X = 1.2;
const SPACING_Z = 1.5;
const BACK_OFFSET = -2.0;

function getFormationPosition(
  index: number,
  playerX: number,
  playerZ: number
): { x: number; y: number; z: number } {
  const row = Math.floor(index / SOLDIERS_PER_ROW);
  const col = index % SOLDIERS_PER_ROW;

  const xOffset = (col - (SOLDIERS_PER_ROW - 1) / 2) * SPACING_X;
  const zOffset = BACK_OFFSET - row * SPACING_Z;

  return {
    x: playerX + xOffset,
    y: GROUND_Y,
    z: playerZ + zOffset,
  };
}

interface ArmySoldierProps {
  index: number;
  playerX: number;
  playerZ: number;
  skinId: string;
  speedMultiplier: number;
}

const ArmySoldier = memo(function ArmySoldier({
  index,
  playerX,
  playerZ,
  skinId,
  speedMultiplier,
}: ArmySoldierProps) {
  const groupRef = useRef<THREE.Group>(null);
  const characterRef = useRef<CharacterModelRef>(null);
  const lastAnimState = useRef(getAnimationFromSpeed(speedMultiplier));

  const currentPos = useRef({
    x: playerX,
    y: GROUND_Y,
    z: playerZ + BACK_OFFSET - Math.floor(index / SOLDIERS_PER_ROW) * SPACING_Z,
  });

  useFrame(() => {
    if (!groupRef.current) return;

    const target = getFormationPosition(index, playerX, playerZ);

    const smoothFactor = 0.12;
    currentPos.current.x = lerp(currentPos.current.x, target.x, smoothFactor);
    currentPos.current.z = lerp(currentPos.current.z, target.z, smoothFactor);
    currentPos.current.y = GROUND_Y;

    groupRef.current.position.set(
      currentPos.current.x,
      currentPos.current.y,
      currentPos.current.z
    );

    const animState = getAnimationFromSpeed(speedMultiplier);
    if (animState !== lastAnimState.current) {
      characterRef.current?.setAnimation(animState);
      lastAnimState.current = animState;
    }
  });

  return (
    <group ref={groupRef} position={[currentPos.current.x, GROUND_Y, currentPos.current.z]}>
      <CharacterModel
        ref={characterRef}
        skinId={skinId}
        animation={getAnimationFromSpeed(speedMultiplier)}
        scale={1}
      />
    </group>
  );
});

interface ArmyFollowersProps {
  armySize: number;
}

export const ArmyFollowers = memo(function ArmyFollowers({
  armySize,
}: ArmyFollowersProps) {
  const { player, status, speedMultiplier } = useGame();
  const { user } = useAuth();

  // Gradually animate to target army size to prevent frame freeze
  const [displayedArmySize, setDisplayedArmySize] = useState(0);
  const targetArmySizeRef = useRef(armySize);

  // Update target when armySize prop changes
  useEffect(() => {
    targetArmySizeRef.current = armySize;
  }, [armySize]);

  // Gradually adjust displayed army size in useFrame to spread load across frames
  useFrame(() => {
    const target = targetArmySizeRef.current;
    const current = displayedArmySize;

    if (current < target) {
      // Adding soldiers - add up to MAX_SOLDIERS_PER_FRAME per frame
      const toAdd = Math.min(MAX_SOLDIERS_PER_FRAME, target - current);
      setDisplayedArmySize(current + toAdd);
    } else if (current > target) {
      // Removing soldiers - can happen instantly (no new components to create)
      setDisplayedArmySize(target);
    }
  });

  const currentSkin = user?.currentSkin || user?.ownedSkins?.[0] || 'default';

  if (displayedArmySize <= 0) return null;
  if (status !== 'playing' && status !== 'countdown' && status !== 'finished') return null;

  return (
    <group>
      {Array.from({ length: displayedArmySize }).map((_, index) => (
        <ArmySoldier
          key={`army-soldier-${index}`}
          index={index}
          playerX={player.position.x}
          playerZ={player.position.z}
          skinId={currentSkin}
          speedMultiplier={speedMultiplier}
        />
      ))}
    </group>
  );
});

export default ArmyFollowers;