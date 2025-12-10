import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import type { EnemyState } from '@shared/types/game.types';
import { EnemyType } from '@shared/types/game.types';
import { COLORS } from '@/utils/constants';
import { useGameStore } from '@/store/gameStore';

// Enemy colors based on type
const ENEMY_COLORS: Record<EnemyType, string> = {
  [EnemyType.STATIC]: COLORS.ENEMY_STATIC,
  [EnemyType.PATROL]: COLORS.ENEMY_PATROL,
  [EnemyType.CHARGER]: COLORS.ENEMY_CHARGER,
  [EnemyType.BOSS]: COLORS.ENEMY_BOSS
};

// Enemy sizes
const ENEMY_SIZES: Record<EnemyType, { radius: number; height: number }> = {
  [EnemyType.STATIC]: { radius: 0.4, height: 0.8 },
  [EnemyType.PATROL]: { radius: 0.5, height: 1.0 },
  [EnemyType.CHARGER]: { radius: 0.5, height: 1.0 },
  [EnemyType.BOSS]: { radius: 1.0, height: 2.0 }
};

interface EnemyProps {
  enemy: EnemyState;
  onDefeat: (enemy: EnemyState) => void;
  onDamagePlayer: (damage: number) => void;
}

export default function Enemy({ enemy, onDefeat, onDamagePlayer }: EnemyProps) {
  const meshRef = useRef<THREE.Group>(null);
  const [currentHp, setCurrentHp] = useState(enemy.hp);
  const [isDefeated, setIsDefeated] = useState(false);
  const [patrolOffset, setPatrolOffset] = useState(0);

  const { player, activePowerUps } = useGameStore();

  const color = ENEMY_COLORS[enemy.type];
  const size = ENEMY_SIZES[enemy.type];

  // Check for shield power-up
  const hasShield = activePowerUps.some(p => p.type === 'shield');

  // Animation and behavior
  useFrame((state, delta) => {
    if (!meshRef.current || isDefeated) return;

    const time = state.clock.elapsedTime;

    // Type-specific behaviors
    switch (enemy.type) {
      case EnemyType.PATROL:
        // Move left and right
        const patrolRange = 2;
        const newOffset = Math.sin(time * 2) * patrolRange;
        setPatrolOffset(newOffset);
        meshRef.current.position.x = enemy.position.x + newOffset;
        break;

      case EnemyType.CHARGER:
        // Charge towards player when close
        const distanceToPlayer = player.position.z - enemy.position.z;
        if (distanceToPlayer < 15 && distanceToPlayer > 0) {
          const chargeSpeed = 5;
          meshRef.current.position.z += chargeSpeed * delta;
        }
        break;

      case EnemyType.BOSS:
        // Slow wobble
        meshRef.current.rotation.y = Math.sin(time) * 0.2;
        break;
    }

    // Idle animation
    meshRef.current.position.y = enemy.position.y + Math.sin(time * 3) * 0.1;
  });

  const handleCollision = () => {
    if (isDefeated) return;

    if (hasShield) {
      // Defeat enemy without taking damage
      setIsDefeated(true);
      onDefeat(enemy);
      return;
    }

    // Combat calculation
    const playerArmy = player.armyCount;
    const enemyHp = currentHp;

    if (playerArmy >= enemyHp) {
      // Player wins
      setIsDefeated(true);
      onDefeat(enemy);
      onDamagePlayer(enemyHp); // Lose soldiers equal to enemy HP
    } else {
      // Player takes damage
      onDamagePlayer(enemy.damage);
    }
  };

  // Called when enemy is shot
  const takeDamage = (damage: number) => {
    const newHp = currentHp - damage;
    if (newHp <= 0) {
      setIsDefeated(true);
      onDefeat(enemy);
    } else {
      setCurrentHp(newHp);
    }
  };

  if (isDefeated) return null;

  return (
    <RigidBody
      type="fixed"
      position={[
        enemy.position.x + patrolOffset,
        enemy.position.y,
        enemy.position.z
      ]}
      sensor
      onIntersectionEnter={handleCollision}
      userData={{ type: 'enemy', data: { ...enemy, takeDamage } }}
    >
      <CuboidCollider args={[size.radius, size.height / 2, size.radius]} sensor />

      <group ref={meshRef}>
        {/* Body */}
        <mesh castShadow>
          <capsuleGeometry args={[size.radius, size.height * 0.6, 8, 16]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.2}
            metalness={0.3}
            roughness={0.7}
          />
        </mesh>

        {/* Eyes */}
        <mesh position={[size.radius * 0.5, size.height * 0.3, size.radius * 0.8]}>
          <sphereGeometry args={[size.radius * 0.2, 8, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[-size.radius * 0.5, size.height * 0.3, size.radius * 0.8]}>
          <sphereGeometry args={[size.radius * 0.2, 8, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        {/* Angry eyebrows for bosses */}
        {enemy.type === EnemyType.BOSS && (
          <>
            <mesh position={[0.4, size.height * 0.5, size.radius]} rotation={[0, 0, -0.5]}>
              <boxGeometry args={[0.4, 0.1, 0.1]} />
              <meshBasicMaterial color="#000000" />
            </mesh>
            <mesh position={[-0.4, size.height * 0.5, size.radius]} rotation={[0, 0, 0.5]}>
              <boxGeometry args={[0.4, 0.1, 0.1]} />
              <meshBasicMaterial color="#000000" />
            </mesh>
          </>
        )}

        {/* HP bar */}
        <group position={[0, size.height + 0.5, 0]}>
          {/* Background */}
          <mesh>
            <planeGeometry args={[1, 0.1]} />
            <meshBasicMaterial color="#333333" />
          </mesh>
          {/* HP fill */}
          <mesh position={[(currentHp / enemy.maxHp - 1) * 0.5, 0, 0.01]}>
            <planeGeometry args={[currentHp / enemy.maxHp, 0.1]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        </group>
      </group>
    </RigidBody>
  );
}

// Render all enemies
interface EnemiesRendererProps {
  enemies: EnemyState[];
  onDefeat: (enemy: EnemyState) => void;
  onDamagePlayer: (damage: number) => void;
}

export function EnemiesRenderer({ enemies, onDefeat, onDamagePlayer }: EnemiesRendererProps) {
  return (
    <group>
      {enemies.filter(e => e.isAlive).map((enemy) => (
        <Enemy
          key={enemy.id}
          enemy={enemy}
          onDefeat={onDefeat}
          onDamagePlayer={onDamagePlayer}
        />
      ))}
    </group>
  );
}
