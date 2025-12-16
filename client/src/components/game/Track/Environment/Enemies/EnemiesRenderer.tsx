import { useRef, memo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGame } from '@/context';
import { EnemySpinner } from './EnemySpinner';
import { EnemyFist, FistPhase } from './EnemyFist';
import { EnemyBoulder } from './EnemyBoulder';
import {
  EnemyData,
  SpinnerData,
  FistData,
  BoulderData,
  SPINNER_KILL_RADIUS,
  FIST_KILL_RADIUS,
  FIST_ARM_LENGTH,
} from '../types';
import { GROUND_Y } from '../../../Player';

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

// =====================
// Spinner Enemy Component
// =====================
interface SingleSpinnerProps {
  enemy: SpinnerData;
  playerX: number;
  playerZ: number;
  armySize: number;
  onPlayerKill: (playerPos: { x: number; z: number }, enemyPos: { x: number; z: number }, enemyRotation: number) => void;
  onSoldiersKill: (deaths: DeathInfo[]) => void;
  status: string;
  hasShield: boolean;
}

const SingleSpinner = memo(function SingleSpinner({
  enemy,
  playerX,
  playerZ,
  armySize,
  onPlayerKill,
  onSoldiersKill,
  status,
  hasShield,
}: SingleSpinnerProps) {
  const killedSoldiersRef = useRef<Set<number>>(new Set());
  const playerKilledRef = useRef(false);
  const currentRotationRef = useRef(0);

  useFrame((_, delta) => {
    if (status !== 'playing') return;

    currentRotationRef.current += enemy.rotationSpeed * Math.PI * 2 * delta;

    const enemyX = enemy.position.x;
    const enemyZ = enemy.position.z;
    const killRadius = SPINNER_KILL_RADIUS;
    const rotation = currentRotationRef.current;

    const isInKillZone = (posX: number, posZ: number): boolean => {
      const dx = posX - enemyX;
      const dz = posZ - enemyZ;
      const distance = Math.sqrt(dx * dx + dz * dz);
      return distance < killRadius;
    };

    if (hasShield) return;

    // Collect ALL soldier deaths
    const deaths: DeathInfo[] = [];

    for (let i = 0; i < armySize; i++) {
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

    if (deaths.length > 0) {
      onSoldiersKill(deaths);
    }

    // Check player collision
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

// =====================
// Fist Enemy Component
// =====================
interface SingleFistProps {
  enemy: FistData;
  playerX: number;
  playerZ: number;
  armySize: number;
  onPlayerKill: (playerPos: { x: number; z: number }, enemyPos: { x: number; z: number }, enemyRotation: number) => void;
  onSoldiersKill: (deaths: DeathInfo[]) => void;
  status: string;
  hasShield: boolean;
}

const SingleFist = memo(function SingleFist({
  enemy,
  playerX,
  playerZ,
  armySize,
  onPlayerKill,
  onSoldiersKill,
  status,
  hasShield,
}: SingleFistProps) {
  const killedSoldiersRef = useRef<Set<number>>(new Set());
  const playerKilledRef = useRef(false);
  const currentPhaseRef = useRef<FistPhase>('cooldown');
  const currentExtensionRef = useRef(0);

  // Track fist phase changes
  const handlePhaseChange = useCallback((phase: FistPhase, extension: number) => {
    currentPhaseRef.current = phase;
    currentExtensionRef.current = extension;
  }, []);

  useFrame(() => {
    if (status !== 'playing') return;
    if (hasShield) return;

    // Only check collision during punch or hold phases
    const phase = currentPhaseRef.current;
    if (phase !== 'punch' && phase !== 'hold') return;

    const extension = currentExtensionRef.current;
    const direction = enemy.side === 'left' ? 1 : -1;

    // Calculate fist position based on extension
    const fistX = enemy.position.x + extension * FIST_ARM_LENGTH * direction;
    const fistZ = enemy.position.z;
    const fistY = GROUND_Y + 1.5;

    const isInKillZone = (posX: number, posZ: number): boolean => {
      const dx = posX - fistX;
      const dz = posZ - fistZ;
      const distance = Math.sqrt(dx * dx + dz * dz);
      return distance < FIST_KILL_RADIUS;
    };

    // Collect soldier deaths
    const deaths: DeathInfo[] = [];

    for (let i = 0; i < armySize; i++) {
      if (killedSoldiersRef.current.has(i)) continue;

      const soldierPos = getArmyPosition(i, playerX, playerZ);
      if (isInKillZone(soldierPos.x, soldierPos.z)) {
        killedSoldiersRef.current.add(i);
        deaths.push({
          soldierIndex: i,
          position: soldierPos,
          enemyPosition: { x: fistX, z: fistZ },
          enemyRotation: direction > 0 ? 0 : Math.PI,
        });
      }
    }

    if (deaths.length > 0) {
      onSoldiersKill(deaths);
    }

    // Check player collision
    if (!playerKilledRef.current && isInKillZone(playerX, playerZ)) {
      playerKilledRef.current = true;
      onPlayerKill(
        { x: playerX, z: playerZ },
        { x: fistX, z: fistZ },
        direction > 0 ? 0 : Math.PI
      );
    }
  });

  return (
    <group position={[enemy.position.x, enemy.position.y, enemy.position.z]}>
      <EnemyFist side={enemy.side} onPhaseChange={handlePhaseChange} />
    </group>
  );
});

// =====================
// Boulder Enemy Component (Non-lethal, blocking only)
// =====================
interface SingleBoulderProps {
  enemy: BoulderData;
  playerX: number;
  playerZ: number;
  status: string;
}

const SingleBoulder = memo(function SingleBoulder({
  enemy,
}: SingleBoulderProps) {
  // Boulder is purely visual/blocking - collision handled in Player.tsx and ArmyFollowers.tsx
  return (
    <group position={[enemy.position.x, enemy.position.y, enemy.position.z]}>
      <EnemyBoulder radius={enemy.radius} rotationY={enemy.rotationY} />
    </group>
  );
});

// =====================
// Main Enemies Renderer
// =====================
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

  // Separate enemies by type
  const spinners = visibleEnemies.filter((e): e is SpinnerData => e.type === 'spinner');
  const fists = visibleEnemies.filter((e): e is FistData => e.type === 'fist');
  const boulders = visibleEnemies.filter((e): e is BoulderData => e.type === 'boulder');

  return (
    <group>
      {/* Spinners */}
      {spinners.map((enemy) => (
        <SingleSpinner
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

      {/* Fists */}
      {fists.map((enemy) => (
        <SingleFist
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

      {/* Boulders (non-lethal) */}
      {boulders.map((enemy) => (
        <SingleBoulder
          key={enemy.id}
          enemy={enemy}
          playerX={player.position.x}
          playerZ={player.position.z}
          status={status}
        />
      ))}
    </group>
  );
});

export default EnemiesRenderer;

// Export the getArmyPosition function for use in other components
export { getArmyPosition, seededRandom };
