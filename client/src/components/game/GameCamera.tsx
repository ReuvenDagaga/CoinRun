import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Vector3 } from '@shared/types/game.types';
import { CLIENT_CONSTANTS } from '@/utils/constants';

interface GameCameraProps {
  target: Vector3;
}

export default function GameCamera({ target }: GameCameraProps) {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3());
  const currentPosition = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    // Calculate target camera position (behind and above player)
    const offset = CLIENT_CONSTANTS.CAMERA_OFFSET;
    targetPosition.current.set(
      target.x + offset.x,
      target.y + offset.y,
      target.z + offset.z
    );

    // Smooth camera movement
    const smoothSpeed = 5;
    currentPosition.current.lerp(targetPosition.current, smoothSpeed * delta);

    // Update camera position
    camera.position.copy(currentPosition.current);

    // Look at player (slightly ahead)
    camera.lookAt(target.x, target.y + 1, target.z + 5);
  });

  return null;
}

// Alternative: Fixed angle camera that follows player
export function FixedCamera({ target }: GameCameraProps) {
  const { camera } = useThree();

  useFrame(() => {
    // Fixed position relative to player
    camera.position.set(target.x, target.y + 10, target.z - 15);
    camera.lookAt(target.x, target.y, target.z + 10);
  });

  return null;
}

// Third-person camera with smooth following
export function ThirdPersonCamera({ target }: GameCameraProps) {
  const { camera } = useThree();
  const cameraOffset = useRef(new THREE.Vector3(0, 8, -12));
  const lookAhead = useRef(new THREE.Vector3(0, 0, 10));

  useFrame((_, delta) => {
    // Desired position
    const desiredPosition = new THREE.Vector3(
      target.x + cameraOffset.current.x,
      target.y + cameraOffset.current.y,
      target.z + cameraOffset.current.z
    );

    // Smooth interpolation
    camera.position.lerp(desiredPosition, 5 * delta);

    // Look ahead of player
    const lookAtPoint = new THREE.Vector3(
      target.x + lookAhead.current.x,
      target.y + lookAhead.current.y,
      target.z + lookAhead.current.z
    );
    camera.lookAt(lookAtPoint);
  });

  return null;
}
