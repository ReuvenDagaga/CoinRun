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

interface SingleEnemyProps {
  enemy: EnemyData;
  playerX: number;
  playerZ: number;
  armySize: number;
  onPlayerKill: () => void;
  onSoldierKill: (soldierIndex: number) => void;
  status: string;
  hasShield: boolean;
}

// Single enemy with collision detection
const SingleEnemy = memo(function SingleEnemy({
  enemy,
  playerX,
  playerZ,
  armySize,
  onPlayerKill,
  onSoldierKill,
  status,
  hasShield,
}: SingleEnemyProps) {
  const hasKilledRef = useRef<Set<string>>(new Set());
  const killCooldownRef = useRef(0);

  useFrame((_, delta) => {
    if (status !== 'playing') return;

    // Cooldown to prevent multiple kills per frame
    if (killCooldownRef.current > 0) {
      killCooldownRef.current -= delta;
      return;
    }

    const enemyX = enemy.position.x;
    const enemyZ = enemy.position.z;
    const killRadius = ENEMY_KILL_RADIUS;

    // Helper to check if position is within kill radius
    const isInKillZone = (posX: number, posZ: number): boolean => {
      const dx = posX - enemyX;
      const dz = posZ - enemyZ;
      const distance = Math.sqrt(dx * dx + dz * dz);
      return distance < killRadius;
    };

    // Check player collision first (if not shielded)
    if (!hasShield && !hasKilledRef.current.has('player')) {
      if (isInKillZone(playerX, playerZ)) {
        hasKilledRef.current.add('player');
        killCooldownRef.current = 0.1; // 100ms cooldown
        onPlayerKill();
        return;
      }
    }

    // Check collision with army soldiers (from back to front to kill rear soldiers first)
    if (!hasShield) {
      for (let i = armySize - 1; i >= 0; i--) {
        const soldierKey = `soldier-${i}`;
        if (hasKilledRef.current.has(soldierKey)) continue;

        const soldierPos = getArmyPosition(i, playerX, playerZ);
        if (isInKillZone(soldierPos.x, soldierPos.z)) {
          hasKilledRef.current.add(soldierKey);
          killCooldownRef.current = 0.05; // 50ms cooldown for soldiers
          onSoldierKill(i);
          return; // Only kill one soldier per frame
        }
      }
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
  onPlayerKill: () => void;
  onSoldierKill: (soldierIndex: number) => void;
  armySize: number;
}

export const EnemiesRenderer = memo(function EnemiesRenderer({
  enemies,
  onPlayerKill,
  onSoldierKill,
  armySize,
}: EnemiesRendererProps) {
  const { player, status, shieldEffect } = useGame();

  // Check if shield is active
  const hasShield = shieldEffect?.active ?? false;

  // Stable callbacks
  const handlePlayerKill = useCallback(() => {
    onPlayerKill();
  }, [onPlayerKill]);

  const handleSoldierKill = useCallback((index: number) => {
    onSoldierKill(index);
  }, [onSoldierKill]);

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
          onSoldierKill={handleSoldierKill}
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
