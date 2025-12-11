import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Vector3 } from '@shared/types/game.types';

// Lerp helper for smooth interpolation
function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

interface GameCameraProps {
  target: Vector3;
}

export default function GameCamera({ target }: GameCameraProps) {
  const { camera } = useThree();

  // Camera offset from player (behind and above)
  const CAMERA_OFFSET = { x: 0, y: 8, z: -15 };

  // Smooth follow factors (0 to 1, higher = snappier)
  const POSITION_SMOOTH = 0.1; // For X position (lateral)
  const Z_SMOOTH = 0.15; // For Z position (forward)

  // Track current smoothed position
  const smoothedX = useRef(0);
  const smoothedZ = useRef(CAMERA_OFFSET.z);

  useFrame(() => {
    // Target camera position
    const targetX = target.x + CAMERA_OFFSET.x;
    const targetY = target.y + CAMERA_OFFSET.y;
    const targetZ = target.z + CAMERA_OFFSET.z;

    // Smooth interpolation for X (lateral movement follows player smoothly)
    smoothedX.current = lerp(smoothedX.current, targetX, POSITION_SMOOTH);

    // Z follows more closely for the forward movement
    smoothedZ.current = lerp(smoothedZ.current, targetZ, Z_SMOOTH);

    // Update camera position with smoothed values
    camera.position.x = smoothedX.current;
    camera.position.y = targetY; // Y doesn't need smoothing (constant height)
    camera.position.z = smoothedZ.current;

    // Look at a point slightly ahead of the player for better feel
    camera.lookAt(
      target.x,
      target.y + 1, // Look slightly above player
      target.z + 5  // Look ahead of player
    );
  });

  return null;
}

// Alternative: More cinematic camera with lag
export function CinematicCamera({ target }: GameCameraProps) {
  const { camera } = useThree();
  const smoothPosition = useRef(new THREE.Vector3(0, 8, -15));
  const lookAtPoint = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    // Desired camera position
    const desired = new THREE.Vector3(
      target.x * 0.5, // Less lateral movement for cinematic feel
      8,
      target.z - 15
    );

    // Very smooth follow
    smoothPosition.current.lerp(desired, 0.05);
    camera.position.copy(smoothPosition.current);

    // Smooth look-at
    const targetLookAt = new THREE.Vector3(target.x, target.y + 1, target.z + 10);
    lookAtPoint.current.lerp(targetLookAt, 0.08);
    camera.lookAt(lookAtPoint.current);
  });

  return null;
}
