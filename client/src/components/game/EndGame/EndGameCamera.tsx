import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/context';
import { STAIR_CONSTANTS } from '@shared/types/game.types';
import { TRACK_LENGTH } from '../Track/config';

// Calculate stairs start position based on actual track length
const STAIRS_START_Z = TRACK_LENGTH + 10;

// Camera animation constants
const STAIR_CAMERA_OFFSET = { x: 8, y: 6, z: -8 };
const CELEBRATION_CAMERA_OFFSET = { x: 0, y: 12, z: -18 };

// Very slow lerp for smooth transitions (no jarring jumps)
const CAMERA_LERP_SPEED = 1.5;
const CAMERA_LOOK_LERP_SPEED = 2.0;

interface EndGameCameraProps {
  enabled?: boolean;
}

export default function EndGameCamera({ enabled = true }: EndGameCameraProps) {
  const { camera } = useThree();
  const { status, endGameState, player, updateEndGameCamera } = useGame();

  // Camera animation state
  const cameraState = useRef({
    // Initialize target to match typical GameCamera position
    targetPosition: new THREE.Vector3(0, 8, TRACK_LENGTH - 15),
    targetLookAt: new THREE.Vector3(0, 2, TRACK_LENGTH),
    currentPosition: new THREE.Vector3(),
    currentLookAt: new THREE.Vector3(),
    isInitialized: false,
    celebrationAngle: 0,
  });

  // Initialize camera position EXACTLY from current camera position on first frame
  useEffect(() => {
    if (status === 'endgame' && enabled && !cameraState.current.isInitialized) {
      // Copy current camera position as starting point
      cameraState.current.currentPosition.copy(camera.position);

      // Estimate current look-at based on player position (GameCamera looks ahead of player)
      cameraState.current.currentLookAt.set(
        player.position.x,
        player.position.y + 1,
        player.position.z + 5
      );

      // Set initial targets to match current position (no jump)
      cameraState.current.targetPosition.copy(camera.position);
      cameraState.current.targetLookAt.copy(cameraState.current.currentLookAt);

      cameraState.current.isInitialized = true;
    }
  }, [status, enabled, camera, player.position]);

  // Reset when not in endgame
  useEffect(() => {
    if (status !== 'endgame') {
      cameraState.current.isInitialized = false;
    }
  }, [status]);

  // Main camera animation
  useFrame((_, delta) => {
    if (!enabled || status !== 'endgame' || !endGameState) return;

    const state = cameraState.current;

    // Only update targets after initialization
    if (!state.isInitialized) return;

    // Update camera targets based on end game phase
    switch (endGameState.phase) {
      case 'approaching':
        handleApproachingCamera(state, delta);
        break;

      case 'entering':
        handleEnteringCamera(state, delta);
        break;

      case 'climbing':
        handleClimbingCamera(state, delta, endGameState.currentStair);
        break;

      case 'finished':
      case 'rewards':
        handleCelebrationCamera(state, delta, endGameState.finalStair);
        break;
    }

    // Smoothly interpolate camera position
    const posLerpFactor = Math.min(CAMERA_LERP_SPEED * delta, 0.1); // Cap to prevent jumps
    state.currentPosition.lerp(state.targetPosition, posLerpFactor);
    camera.position.copy(state.currentPosition);

    // Smoothly interpolate look-at target
    const lookLerpFactor = Math.min(CAMERA_LOOK_LERP_SPEED * delta, 0.15);
    state.currentLookAt.lerp(state.targetLookAt, lookLerpFactor);
    camera.lookAt(state.currentLookAt);

    // Update context with camera state
    updateEndGameCamera(
      { x: state.currentPosition.x, y: state.currentPosition.y, z: state.currentPosition.z },
      { x: state.targetLookAt.x, y: state.targetLookAt.y, z: state.targetLookAt.z },
      0
    );
  });

  return null;
}

// Handle camera during approaching phase - slowly transition to reveal position
function handleApproachingCamera(
  state: { targetPosition: THREE.Vector3; targetLookAt: THREE.Vector3 },
  delta: number
) {
  // Gradually move camera to approach viewing angle
  // Keep camera behind player, looking forward at the finish gate
  state.targetPosition.set(
    0,
    10, // Slightly higher for better view
    TRACK_LENGTH - 20
  );
  state.targetLookAt.set(0, 4, TRACK_LENGTH + 20);
}

// Handle camera during entering phase - move to side view for stair reveal
function handleEnteringCamera(
  state: { targetPosition: THREE.Vector3; targetLookAt: THREE.Vector3 },
  delta: number
) {
  state.targetPosition.set(
    STAIR_CAMERA_OFFSET.x,
    STAIR_CAMERA_OFFSET.y,
    STAIRS_START_Z + STAIR_CAMERA_OFFSET.z
  );
  state.targetLookAt.set(0, 3, STAIRS_START_Z + 10);
}

// Handle camera during climbing phase - follow player up stairs from side
function handleClimbingCamera(
  state: { targetPosition: THREE.Vector3; targetLookAt: THREE.Vector3 },
  delta: number,
  currentStair: number
) {
  const stairIndex = Math.max(0, currentStair);
  const stairZ = STAIRS_START_Z +
    stairIndex * (STAIR_CONSTANTS.STAIR_DEPTH + STAIR_CONSTANTS.STAIR_GAP);
  const stairY = stairIndex * STAIR_CONSTANTS.STAIR_HEIGHT;

  // Camera follows player up stairs from side angle
  state.targetPosition.set(
    STAIR_CAMERA_OFFSET.x * (1 - stairIndex * 0.05),
    STAIR_CAMERA_OFFSET.y + stairY * 0.6,
    stairZ + STAIR_CAMERA_OFFSET.z
  );

  state.targetLookAt.set(
    0,
    stairY + 2,
    stairZ + STAIR_CONSTANTS.STAIR_DEPTH / 2
  );
}

// Handle camera during celebration phase - slow orbit around player
function handleCelebrationCamera(
  state: { targetPosition: THREE.Vector3; targetLookAt: THREE.Vector3; celebrationAngle: number },
  delta: number,
  finalStair: number
) {
  const stairZ = STAIRS_START_Z +
    Math.max(0, finalStair - 1) * (STAIR_CONSTANTS.STAIR_DEPTH + STAIR_CONSTANTS.STAIR_GAP);
  const stairY = Math.max(0, finalStair - 1) * STAIR_CONSTANTS.STAIR_HEIGHT;

  // Slow circular camera movement
  state.celebrationAngle += delta * 0.3;

  const radius = 15;
  const cameraX = Math.sin(state.celebrationAngle) * radius;
  const cameraZ = stairZ + Math.cos(state.celebrationAngle) * radius - 5;

  state.targetPosition.set(
    cameraX,
    CELEBRATION_CAMERA_OFFSET.y + stairY * 0.5,
    cameraZ
  );

  state.targetLookAt.set(0, stairY + 3, stairZ);
}
