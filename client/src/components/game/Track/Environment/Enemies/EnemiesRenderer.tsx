import { useRef, memo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGame } from '@/context';
import { EnemySpinner } from './EnemySpinner';
import { EnemyData, ENEMY_KILL_RADIUS } from '../types';

// Formation constants for army position calculation
const SOLDIERS_PER_ROW = 3;
const SPACING_X = 0.8; // Tighter spacing for new formation
const SPACING_Z = 1.0;
const BACK_OFFSET = -1.5;

// Seeded random for consistent randomization per soldier
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// Calculate army soldier position with organic randomization
function getArmyPosition(
  index: number,
  playerX: number,
  playerZ: number
): { x: number; z: number } {
  const row = Math.floor(index / SOLDIERS_PER_ROW);
  const col = index % SOLDIERS_PER_ROW;

  // Base position in tighter grid
  const baseXOffset = (col - (SOLDIERS_PER_ROW - 1) / 2) * SPACING_X;
  const baseZOffset = BACK_OFFSET - row * SPACING_Z;

  // Add seeded random offsets for organic feel
  const seedX = index * 7 + 13;
  const seedZ = index * 11 + 17;
  const randomXOffset = (seededRandom(seedX) - 0.5) * 0.6; // ±0.3 units
  const randomZOffset = (seededRandom(seedZ) - 0.5) * 0.4; // ±0.2 units

  return {
    x: playerX + baseXOffset + randomXOffset,
    z: playerZ + baseZOffset + randomZOffset,
  };
}

// Death info for creating ragdoll effects
export interface DeathInfo {
  soldierIndex: number;
  position: { x: number; z: number };
  enemyPosition: { x: number; z: number };
  enemyRotation: number;
}

interface SingleEnemyProps {
  enemy: EnemyData;
  playerX: number;
  playerZ: number;
  armySize: number;
  onPlayerKill: (playerPos: { x: number; z: number }, enemyPos: { x: number; z: number }, enemyRotation: number) => void;
  onSoldiersKill: (deaths: DeathInfo[]) => void;
  status: string;
  hasShield: boolean;
}

// Single enemy with collision detection - collects ALL hits in one frame
const SingleEnemy = memo(function SingleEnemy({
  enemy,
  playerX,
  playerZ,
  armySize,
  onPlayerKill,
  onSoldiersKill,
  status,
  hasShield,
}: SingleEnemyProps) {
  // Track which entities have been killed by this enemy (persistent)
  const killedSoldiersRef = useRef<Set<number>>(new Set());
  const playerKilledRef = useRef(false);
  // Track current rotation of the spinner for push direction
  const currentRotationRef = useRef(0);

  useFrame((_, delta) => {
    if (status !== 'playing') return;

    // Update rotation tracking (must match EnemySpinner rotation)
    currentRotationRef.current += enemy.rotationSpeed * Math.PI * 2 * delta;

    const enemyX = enemy.position.x;
    const enemyZ = enemy.position.z;
    const killRadius = ENEMY_KILL_RADIUS;
    const rotation = currentRotationRef.current;

    // Helper to check if position is within kill radius
    const isInKillZone = (posX: number, posZ: number): boolean => {
      const dx = posX - enemyX;
      const dz = posZ - enemyZ;
      const distance = Math.sqrt(dx * dx + dz * dz);
      return distance < killRadius;
    };

    if (hasShield) return;

    // Collect ALL soldier deaths in this frame (no early return!)
    const deaths: DeathInfo[] = [];

    for (let i = 0; i < armySize; i++) {
      // Skip if already killed by this enemy
      if (killedSoldiersRef.current.has(i)) continue;

      const soldierPos = getArmyPosition(i, playerX, playerZ);
      if (isInKillZone(soldierPos.x, soldierPos.z)) {
        killedSoldiersRef.current.add(i);
        deaths.push({
          soldierIndex: i,
          position: soldierPos,
          enemyPosition: { x: enemyX, z: enemyZ },
          enemyRotation: rotation,
        });
      }
    }

    // Process ALL soldier deaths at once
    if (deaths.length > 0) {
      onSoldiersKill(deaths);
    }

    // Check player collision (separate from soldiers, always check)
    if (!playerKilledRef.current && isInKillZone(playerX, playerZ)) {
      playerKilledRef.current = true;
      onPlayerKill(
        { x: playerX, z: playerZ },
        { x: enemyX, z: enemyZ },
        rotation
      );
    }
  });

  return (
    <group position={[enemy.position.x, enemy.position.y, enemy.position.z]}>
      <EnemySpinner rotationSpeed={enemy.rotationSpeed} />
    </group>
  );
});

interface EnemiesRendererProps {
  enemies: EnemyData[];
  onPlayerKill: (playerPos: { x: number; z: number }, enemyPos: { x: number; z: number }, enemyRotation: number) => void;
  onSoldiersKill: (deaths: DeathInfo[]) => void;
  armySize: number;
}

export const EnemiesRenderer = memo(function EnemiesRenderer({
  enemies,
  onPlayerKill,
  onSoldiersKill,
  armySize,
}: EnemiesRendererProps) {
  const { player, status, shieldEffect } = useGame();

  // Check if shield is active
  const hasShield = shieldEffect?.active ?? false;

  // Stable callbacks
  const handlePlayerKill = useCallback(
    (playerPos: { x: number; z: number }, enemyPos: { x: number; z: number }, rotation: number) => {
      onPlayerKill(playerPos, enemyPos, rotation);
    },
    [onPlayerKill]
  );

  const handleSoldiersKill = useCallback(
    (deaths: DeathInfo[]) => {
      onSoldiersKill(deaths);
    },
    [onSoldiersKill]
  );

  // Filter visible enemies (only render enemies within view distance)
  const visibleEnemies = enemies.filter(
    (enemy) => Math.abs(enemy.position.z - player.position.z) < 100
  );

  return (
    <group>
      {visibleEnemies.map((enemy) => (
        <SingleEnemy
          key={enemy.id}
          enemy={enemy}
          playerX={player.position.x}
          playerZ={player.position.z}
          armySize={armySize}
          onPlayerKill={handlePlayerKill}
          onSoldiersKill={handleSoldiersKill}
          status={status}
          hasShield={hasShield}
        />
      ))}
    </group>
  );
});

export default EnemiesRenderer;

// Export the getArmyPosition function for use in other components
export { getArmyPosition, seededRandom };
