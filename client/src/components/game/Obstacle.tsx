import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import type { ObstacleState } from '@shared/types/game.types';
import { ObstacleType } from '@shared/types/game.types';
import { COLORS } from '@/utils/constants';

interface ObstacleProps {
  obstacle: ObstacleState;
  onCollision: (obstacle: ObstacleState) => void;
}

export default function Obstacle({ obstacle, onCollision }: ObstacleProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Moving platform animation
  useFrame((state) => {
    if (!meshRef.current || obstacle.type !== ObstacleType.MOVING_PLATFORM) return;

    const time = state.clock.elapsedTime;
    meshRef.current.position.y = obstacle.position.y + Math.sin(time * 2) * 1;
  });

  const handleCollision = () => {
    onCollision(obstacle);
  };

  switch (obstacle.type) {
    case ObstacleType.WALL:
      return (
        <RigidBody
          type="fixed"
          position={[obstacle.position.x, obstacle.position.y, obstacle.position.z]}
          onCollisionEnter={handleCollision}
          userData={{ type: 'obstacle', data: obstacle }}
        >
          <CuboidCollider args={[obstacle.width / 2, obstacle.height / 2, 0.3]} />
          <mesh ref={meshRef} castShadow>
            <boxGeometry args={[obstacle.width, obstacle.height, 0.6]} />
            <meshStandardMaterial
              color={COLORS.OBSTACLE_WALL}
              metalness={0.2}
              roughness={0.8}
            />
          </mesh>
          {/* Warning stripes */}
          <mesh position={[0, 0, 0.31]}>
            <planeGeometry args={[obstacle.width, obstacle.height]} />
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.5} />
          </mesh>
        </RigidBody>
      );

    case ObstacleType.GAP:
      return (
        <group position={[obstacle.position.x, obstacle.position.y, obstacle.position.z]}>
          {/* Gap visual - hole in ground */}
          <mesh position={[0, -0.4, 0]} receiveShadow>
            <boxGeometry args={[obstacle.width, 0.2, 3]} />
            <meshStandardMaterial color={COLORS.OBSTACLE_GAP} />
          </mesh>
          {/* Danger zone collider */}
          <RigidBody
            type="fixed"
            position={[0, -1, 0]}
            sensor
            onIntersectionEnter={handleCollision}
            userData={{ type: 'gap', data: obstacle }}
          >
            <CuboidCollider args={[obstacle.width / 2, 0.5, 1.5]} sensor />
          </RigidBody>
        </group>
      );

    case ObstacleType.MOVING_PLATFORM:
      return (
        <RigidBody
          type="kinematicPosition"
          position={[obstacle.position.x, obstacle.position.y, obstacle.position.z]}
          userData={{ type: 'platform', data: obstacle }}
        >
          <mesh ref={meshRef} castShadow>
            <boxGeometry args={[obstacle.width, 0.3, 2]} />
            <meshStandardMaterial
              color="#4ade80"
              emissive="#4ade80"
              emissiveIntensity={0.2}
              metalness={0.3}
              roughness={0.7}
            />
          </mesh>
        </RigidBody>
      );

    default:
      return null;
  }
}

// Render all obstacles
interface ObstaclesRendererProps {
  obstacles: ObstacleState[];
  onCollision: (obstacle: ObstacleState) => void;
}

export function ObstaclesRenderer({ obstacles, onCollision }: ObstaclesRendererProps) {
  return (
    <group>
      {obstacles.map((obstacle) => (
        <Obstacle
          key={obstacle.id}
          obstacle={obstacle}
          onCollision={onCollision}
        />
      ))}
    </group>
  );
}
