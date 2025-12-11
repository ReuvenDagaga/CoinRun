import { useRef, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider, useRapier } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { useUserStore } from '@/store/userStore';
import { GAME_CONSTANTS, getPlayerSpeed, getJumpHeight, GateType } from '@shared/types/game.types';
import { COLORS } from '@/utils/constants';

// Path point for army snake following
export interface PathPoint {
  position: THREE.Vector3;
  rotation: THREE.Quaternion;
  timestamp: number;
}

// Global path storage for army to follow
export const playerPath: PathPoint[] = [];
const MAX_PATH_LENGTH = 500;

interface PlayerProps {
  onCollision?: (type: string, data: unknown) => void;
  onFallOff?: () => void;
}

export default function Player({ onCollision, onFallOff }: PlayerProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const isGrounded = useRef(true);
  const lastPathRecordTime = useRef(0);
  const jumpCooldown = useRef(false);

  const { status, player, updatePlayerPosition, activePowerUps, damageArmy } = useGameStore();
  const user = useUserStore((state) => state.user);

  // Get player stats from upgrades
  const speedLevel = user?.upgrades.speed || 0;
  const jumpLevel = user?.upgrades.jump || 0;
  const speed = getPlayerSpeed(speedLevel);
  const jumpHeight = getJumpHeight(jumpLevel);

  // Check for speed boost power-up
  const hasSpeedBoost = activePowerUps.some(p => p.type === GateType.SPEED);
  const actualSpeed = hasSpeedBoost ? speed * 2 : speed;

  // Track width boundaries
  const TRACK_HALF_WIDTH = GAME_CONSTANTS.TRACK_HALF_WIDTH;
  const HORIZONTAL_SPEED = GAME_CONSTANTS.HORIZONTAL_SPEED;

  // Reset jump state
  const resetJump = useCallback(() => {
    useGameStore.setState((state) => ({
      player: { ...state.player, isJumping: false }
    }));
    jumpCooldown.current = false;
  }, []);

  // Handle falling off the track
  const handleFallOff = useCallback(() => {
    // Lose 5 soldiers when falling off
    damageArmy(5);
    onFallOff?.();
  }, [damageArmy, onFallOff]);

  useFrame((state, delta) => {
    if (!rigidBodyRef.current || status !== 'playing') return;

    const position = rigidBodyRef.current.translation();
    const velocity = rigidBodyRef.current.linvel();

    // Calculate new X position based on horizontal velocity
    let newX = position.x + (player.horizontalVelocity * HORIZONTAL_SPEED * delta);

    // Boundary checking - fall off if beyond track width
    if (Math.abs(newX) > TRACK_HALF_WIDTH + 0.5) {
      // Player fell off the edge
      handleFallOff();
      // Reset to edge
      newX = Math.sign(newX) * (TRACK_HALF_WIDTH - 0.5);
    } else {
      // Soft boundary - clamp to track width
      newX = Math.max(-TRACK_HALF_WIDTH, Math.min(TRACK_HALF_WIDTH, newX));
    }

    // Move forward constantly + apply horizontal movement
    rigidBodyRef.current.setLinvel(
      {
        x: 0, // We set position directly for smoother horizontal movement
        y: velocity.y,
        z: actualSpeed
      },
      true
    );

    // Apply horizontal position directly for smoother control
    rigidBodyRef.current.setTranslation(
      {
        x: newX,
        y: position.y,
        z: position.z
      },
      true
    );

    // Handle jumping with improved physics
    if (player.isJumping && isGrounded.current && !jumpCooldown.current) {
      const jumpForce = GAME_CONSTANTS.JUMP_FORCE * (1 + jumpLevel * 0.05);
      rigidBodyRef.current.applyImpulse({ x: 0, y: jumpForce, z: 0 }, true);
      isGrounded.current = false;
      jumpCooldown.current = true;

      // Reset jumping state after jump animation
      setTimeout(() => {
        resetJump();
      }, 600);
    }

    // Improved ground detection using velocity and position
    if (position.y < 0.7 && velocity.y <= 0.1 && velocity.y >= -0.5) {
      isGrounded.current = true;
    } else if (velocity.y < -0.5) {
      isGrounded.current = false;
    }

    // Update player position in store (including X for army following)
    updatePlayerPosition(position.z, newX);

    // Record path for army snake following
    const now = Date.now();
    if (now - lastPathRecordTime.current >= GAME_CONSTANTS.PATH_RECORD_INTERVAL) {
      lastPathRecordTime.current = now;

      playerPath.push({
        position: new THREE.Vector3(newX, position.y, position.z),
        rotation: new THREE.Quaternion(),
        timestamp: now
      });

      // Trim old positions
      while (playerPath.length > MAX_PATH_LENGTH) {
        playerPath.shift();
      }
    }

    // Update mesh rotation for visual effect
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * actualSpeed * 0.3;
    }
  });

  // Clear path on mount
  useEffect(() => {
    playerPath.length = 0;
  }, []);

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
      linearDamping={0.3}
      angularDamping={0.5}
      enabledRotations={[false, false, false]}
      gravityScale={1.5}
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
