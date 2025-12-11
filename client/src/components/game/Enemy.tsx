import { useRef, useState, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { EnemyState } from '@shared/types/game.types';
import { EnemyType, GAME_CONSTANTS, GateType, getBulletDamage } from '@shared/types/game.types';
import { COLORS } from '@/utils/constants';
import { useGameStore } from '@/store/gameStore';
import { useUserStore } from '@/store/userStore';
import { getActiveBullets, deactivateBullet } from './PowerUp';

// Performance constants
const RENDER_DISTANCE = 100; // Only render enemies within this distance
const COLLISION_CHECK_DISTANCE = 50; // Only check collisions within this distance
const HP_BAR_DISTANCE = 30; // Only show HP bars within this distance

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

// Memoized single enemy component
const Enemy = memo(function Enemy({ enemy, onDefeat, onDamagePlayer }: EnemyProps) {
  const meshRef = useRef<THREE.Group>(null);
  const positionRef = useRef(new THREE.Vector3(enemy.position.x, enemy.position.y, enemy.position.z));
  const [currentHp, setCurrentHp] = useState(enemy.hp);
  const [isDefeated, setIsDefeated] = useState(false);
  const patrolOffset = useRef(0);
  const lastCollisionTime = useRef(0);

  const { player, activePowerUps } = useGameStore();
  const user = useUserStore((state) => state.user);

  const color = ENEMY_COLORS[enemy.type];
  const size = ENEMY_SIZES[enemy.type];

  // Check for power-ups
  const hasShield = activePowerUps.some(p => p.type === GateType.SHIELD);
  const hasBulletsBoost = activePowerUps.some(p => p.type === GateType.BULLETS);
  const bulletPower = user?.upgrades.bulletPower || 0;

  // Animation and behavior + bullet collision check
  useFrame((state, delta) => {
    if (!meshRef.current || isDefeated) return;

    const time = state.clock.elapsedTime;

    // Distance check - skip processing if too far
    const distToPlayer = Math.abs(enemy.position.z - player.position.z);
    if (distToPlayer > RENDER_DISTANCE) {
      meshRef.current.visible = false;
      return;
    }
    meshRef.current.visible = true;

    // Update position reference
    positionRef.current.set(
      enemy.position.x + patrolOffset.current,
      enemy.position.y,
      enemy.position.z
    );

    // Type-specific behaviors
    switch (enemy.type) {
      case EnemyType.PATROL:
        // Move left and right
        const patrolRange = 2;
        patrolOffset.current = Math.sin(time * 2) * patrolRange;
        meshRef.current.position.x = enemy.position.x + patrolOffset.current;
        positionRef.current.x = enemy.position.x + patrolOffset.current;
        break;

      case EnemyType.CHARGER:
        // Charge towards player when close
        const distanceToPlayer = player.position.z - enemy.position.z;
        if (distanceToPlayer < 15 && distanceToPlayer > 0) {
          const chargeSpeed = 5;
          meshRef.current.position.z += chargeSpeed * delta;
          positionRef.current.z = meshRef.current.position.z;
        }
        break;

      case EnemyType.BOSS:
        // Slow wobble
        meshRef.current.rotation.y = Math.sin(time) * 0.2;
        break;
    }

    // Idle animation
    meshRef.current.position.y = enemy.position.y + Math.sin(time * 3) * 0.1;

    // Only check collisions if within collision distance
    if (distToPlayer < COLLISION_CHECK_DISTANCE) {
      // Check bullet collisions (batched)
      const activeBullets = getActiveBullets();
      const hitRadius = size.radius + 0.3;

      for (const bullet of activeBullets) {
        const dx = bullet.position.x - positionRef.current.x;
        const dy = bullet.position.y - positionRef.current.y;
        const dz = bullet.position.z - positionRef.current.z;
        const distSq = dx * dx + dy * dy + dz * dz;

        // Use squared distance for performance
        if (distSq < hitRadius * hitRadius) {
          deactivateBullet(bullet.id);

          const baseDamage = getBulletDamage(bulletPower);
          const damage = hasBulletsBoost ? baseDamage * 2 : baseDamage;

          const newHp = currentHp - damage;
          if (newHp <= 0) {
            setIsDefeated(true);
            onDefeat(enemy);
          } else {
            setCurrentHp(newHp);
          }
          break;
        }
      }

      // Check player collision (throttled)
      const now = Date.now();
      if (now - lastCollisionTime.current > 100) {
        lastCollisionTime.current = now;

        const playerDx = player.position.x - positionRef.current.x;
        const playerDz = player.position.z - positionRef.current.z;
        const playerDistSq = playerDx * playerDx + playerDz * playerDz;
        const collisionRadius = size.radius + 0.5;

        if (playerDistSq < collisionRadius * collisionRadius) {
          handleCollision();
        }
      }
    }
  });

  const handleCollision = () => {
    if (isDefeated) return;

    if (hasShield) {
      setIsDefeated(true);
      onDefeat(enemy);
      return;
    }

    const playerArmy = player.armyCount;
    const enemyHp = currentHp;

    if (playerArmy >= enemyHp) {
      setIsDefeated(true);
      onDefeat(enemy);
      onDamagePlayer(enemyHp);
    } else {
      onDamagePlayer(enemy.damage);
    }
  };

  if (isDefeated) return null;

  // Calculate distance for LOD
  const distToPlayer = Math.abs(enemy.position.z - player.position.z);
  const showHpBar = distToPlayer < HP_BAR_DISTANCE;

  return (
    <group
      ref={meshRef}
      position={[
        enemy.position.x + patrolOffset.current,
        enemy.position.y,
        enemy.position.z
      ]}
    >
      {/* Body - Use lower poly geometry for distant enemies */}
      <mesh castShadow>
        <capsuleGeometry args={[size.radius, size.height * 0.6, 4, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.2}
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>

      {/* Eyes - Only render when close */}
      {distToPlayer < 40 && (
        <>
          <mesh position={[size.radius * 0.5, size.height * 0.3, size.radius * 0.8]}>
            <sphereGeometry args={[size.radius * 0.2, 6, 6]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[-size.radius * 0.5, size.height * 0.3, size.radius * 0.8]}>
            <sphereGeometry args={[size.radius * 0.2, 6, 6]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </>
      )}

      {/* Angry eyebrows for bosses - Only render when close */}
      {enemy.type === EnemyType.BOSS && distToPlayer < 40 && (
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

      {/* HP bar - Only render when close */}
      {showHpBar && (
        <group position={[0, size.height + 0.5, 0]}>
          <mesh>
            <planeGeometry args={[1, 0.1]} />
            <meshBasicMaterial color="#333333" />
          </mesh>
          <mesh position={[(currentHp / enemy.maxHp - 1) * 0.5, 0, 0.01]}>
            <planeGeometry args={[currentHp / enemy.maxHp, 0.1]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        </group>
      )}
    </group>
  );
});

// Optimized enemies renderer with distance culling
interface EnemiesRendererProps {
  enemies: EnemyState[];
  onDefeat: (enemy: EnemyState) => void;
  onDamagePlayer: (damage: number) => void;
}

export function EnemiesRenderer({ enemies, onDefeat, onDamagePlayer }: EnemiesRendererProps) {
  const { player } = useGameStore();

  // Filter enemies by render distance for initial culling
  const visibleEnemies = useMemo(() => {
    return enemies.filter(e => {
      if (!e.isAlive) return false;
      const dist = Math.abs(e.position.z - player.position.z);
      return dist < RENDER_DISTANCE;
    });
  }, [enemies, player.position.z]);

  return (
    <group>
      {visibleEnemies.map((enemy) => (
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

export default Enemy;
