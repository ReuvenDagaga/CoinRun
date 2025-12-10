import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { useUserStore } from '@/store/userStore';
import { GAME_CONSTANTS, getPlayerSpeed, getJumpHeight, GateType } from '@shared/types/game.types';
import { COLORS, CLIENT_CONSTANTS } from '@/utils/constants';

interface PlayerProps {
  onCollision?: (type: string, data: unknown) => void;
}

export default function Player({ onCollision }: PlayerProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const targetLaneX = useRef(0);
  const isGrounded = useRef(true);

  const { status, player, handleSwipe, updatePlayerPosition, activePowerUps } = useGameStore();
  const user = useUserStore((state) => state.user);

  // Get player stats from upgrades
  const speedLevel = user?.upgrades.speed || 0;
  const jumpLevel = user?.upgrades.jump || 0;
  const speed = getPlayerSpeed(speedLevel);
  const jumpHeight = getJumpHeight(jumpLevel);

  // Calculate target X position based on lane
  const laneX = (player.lane - 1) * GAME_CONSTANTS.LANE_WIDTH;

  // Check for speed boost power-up
  const hasSpeedBoost = activePowerUps.some(p => p.type === GateType.SPEED);
  const actualSpeed = hasSpeedBoost ? speed * 2 : speed;

  // Update target lane position when lane changes
  useEffect(() => {
    targetLaneX.current = laneX;
  }, [laneX]);

  useFrame((state, delta) => {
    if (!rigidBodyRef.current || status !== 'playing') return;

    const position = rigidBodyRef.current.translation();
    const velocity = rigidBodyRef.current.linvel();

    // Move forward constantly
    rigidBodyRef.current.setLinvel(
      {
        x: velocity.x,
        y: velocity.y,
        z: actualSpeed
      },
      true
    );

    // Smooth lane switching
    const currentX = position.x;
    const targetX = targetLaneX.current;
    const diff = targetX - currentX;

    if (Math.abs(diff) > 0.1) {
      const moveSpeed = 20; // Lane switch speed
      const moveAmount = Math.sign(diff) * Math.min(Math.abs(diff), moveSpeed * delta);
      rigidBodyRef.current.setTranslation(
        {
          x: currentX + moveAmount,
          y: position.y,
          z: position.z
        },
        true
      );
    }

    // Handle jumping
    if (player.isJumping && isGrounded.current) {
      const jumpForce = GAME_CONSTANTS.JUMP_FORCE * (1 + jumpLevel * 0.05);
      rigidBodyRef.current.applyImpulse({ x: 0, y: jumpForce, z: 0 }, true);
      isGrounded.current = false;

      // Reset jumping state after animation
      setTimeout(() => {
        useGameStore.setState((state) => ({
          player: { ...state.player, isJumping: false }
        }));
      }, 500);
    }

    // Check if grounded (simple ground check)
    if (position.y < 0.6 && velocity.y <= 0) {
      isGrounded.current = true;
    }

    // Update player position in store
    updatePlayerPosition(position.z);

    // Update mesh rotation for visual effect
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * actualSpeed * 0.5;
    }
  });

  // Get skin colors
  const primaryColor = COLORS.PLAYER_PRIMARY;
  const secondaryColor = COLORS.PLAYER_SECONDARY;

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={[0, 1, 0]}
      type="dynamic"
      colliders={false}
      mass={1}
      linearDamping={0.5}
      angularDamping={0.5}
      enabledRotations={[false, false, false]}
      onCollisionEnter={(event) => {
        const userData = event.other.rigidBody?.userData as { type?: string; data?: unknown };
        if (userData?.type) {
          onCollision?.(userData.type, userData.data);
        }

        // Check if landed on ground
        if (event.other.rigidBody?.userData === 'ground') {
          isGrounded.current = true;
        }
      }}
      userData={{ type: 'player' }}
    >
      <CuboidCollider args={[0.4, 0.5, 0.4]} />

      {/* Player body */}
      <group>
        {/* Main body */}
        <mesh ref={meshRef} castShadow>
          <capsuleGeometry args={[0.35, 0.6, 8, 16]} />
          <meshStandardMaterial
            color={primaryColor}
            emissive={hasSpeedBoost ? '#3b82f6' : '#000000'}
            emissiveIntensity={hasSpeedBoost ? 0.5 : 0}
            metalness={0.3}
            roughness={0.7}
          />
        </mesh>

        {/* Head */}
        <mesh position={[0, 0.7, 0]} castShadow>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial
            color={secondaryColor}
            metalness={0.4}
            roughness={0.6}
          />
        </mesh>

        {/* Eyes */}
        <mesh position={[0.1, 0.75, 0.2]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="white" />
        </mesh>
        <mesh position={[-0.1, 0.75, 0.2]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="white" />
        </mesh>

        {/* Shield effect when active */}
        {activePowerUps.some(p => p.type === GateType.SHIELD) && (
          <mesh>
            <sphereGeometry args={[0.8, 16, 16]} />
            <meshStandardMaterial
              color="#8b5cf6"
              transparent
              opacity={0.3}
              emissive="#8b5cf6"
              emissiveIntensity={0.5}
            />
          </mesh>
        )}

        {/* Magnet effect */}
        {activePowerUps.some(p => p.type === GateType.MAGNET) && (
          <mesh>
            <torusGeometry args={[1.5, 0.05, 8, 32]} />
            <meshBasicMaterial color="#ec4899" transparent opacity={0.5} />
          </mesh>
        )}
      </group>
    </RigidBody>
  );
}
