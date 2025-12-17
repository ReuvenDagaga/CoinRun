import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/context';
import { STAIR_CONSTANTS } from '@shared/types/game.types';
import { TRACK_LENGTH } from '../Track/config';

// Camera animation constants
const APPROACH_CAMERA_OFFSET = { x: 0, y: 8, z: -15 };
const STAIR_CAMERA_OFFSET = { x: 8, y: 6, z: -8 };
const CELEBRATION_CAMERA_OFFSET = { x: 0, y: 12, z: -18 };
const CAMERA_LERP_SPEED = 2;
const CAMERA_LOOK_LERP_SPEED = 3;

interface EndGameCameraProps {
  enabled?: boolean;
}

export default function EndGameCamera({ enabled = true }: EndGameCameraProps) {
  const { camera } = useThree();
  const { status, endGameState, player, updateEndGameCamera } = useGame();

  // Camera animation state
  const cameraState = useRef({
    targetPosition: new THREE.Vector3(0, 8, TRACK_LENGTH - 15),
    targetLookAt: new THREE.Vector3(0, 2, TRACK_LENGTH),
    currentPosition: new THREE.Vector3(),
    currentLookAt: new THREE.Vector3(),
    phase: 'approaching' as 'approaching' | 'entering' | 'climbing' | 'celebrating',
    transitionProgress: 0,
    celebrationAngle: 0,
  });

  // Initialize camera position
  useEffect(() => {
    if (status === 'endgame' && enabled) {
      cameraState.current.currentPosition.copy(camera.position);
      cameraState.current.currentLookAt.set(0, 2, player.distanceTraveled);
    }
  }, [status, enabled, camera, player.distanceTraveled]);

  // Main camera animation
  useFrame((_, delta) => {
    if (!enabled || status !== 'endgame' || !endGameState) return;

    const state = cameraState.current;

    // Update camera based on end game phase
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
        handleCelebrationCamera(state, delta, endGameState.finalStair);
        break;

      case 'rewards':
        // Keep celebration camera
        handleCelebrationCamera(state, delta, endGameState.finalStair);
        break;
    }

    // Smoothly interpolate camera position
    state.currentPosition.lerp(state.targetPosition, CAMERA_LERP_SPEED * delta);
    camera.position.copy(state.currentPosition);

    // Smoothly interpolate look-at target
    state.currentLookAt.lerp(state.targetLookAt, CAMERA_LOOK_LERP_SPEED * delta);
    camera.lookAt(state.currentLookAt);

    // Update context with camera state
    updateEndGameCamera(
      { x: state.currentPosition.x, y: state.currentPosition.y, z: state.currentPosition.z },
      { x: state.targetLookAt.x, y: state.targetLookAt.y, z: state.targetLookAt.z },
      state.transitionProgress
    );
  });

  return null;
}

// Handle camera during approaching phase
function handleApproachingCamera(
  state: ReturnType<typeof useRef<any>>['current'],
  delta: number
) {
  // Pull camera back slightly for dramatic reveal
  const targetZ = TRACK_LENGTH - 10;
  state.targetPosition.set(
    APPROACH_CAMERA_OFFSET.x,
    APPROACH_CAMERA_OFFSET.y,
    targetZ + APPROACH_CAMERA_OFFSET.z
  );
  state.targetLookAt.set(0, 4, TRACK_LENGTH + 10);
  state.transitionProgress = Math.min(state.transitionProgress + delta, 1);
}

// Handle camera during entering phase
function handleEnteringCamera(
  state: ReturnType<typeof useRef<any>>['current'],
  delta: number
) {
  // Move camera to side view for stair reveal
  const stairStartZ = STAIR_CONSTANTS.STAIRS_START_Z;
  state.targetPosition.set(
    STAIR_CAMERA_OFFSET.x,
    STAIR_CAMERA_OFFSET.y,
    stairStartZ + STAIR_CAMERA_OFFSET.z
  );
  state.targetLookAt.set(0, 3, stairStartZ + 10);
  state.transitionProgress = Math.min(state.transitionProgress + delta * 0.5, 1);
}

// Handle camera during climbing phase
function handleClimbingCamera(
  state: ReturnType<typeof useRef<any>>['current'],
  delta: number,
  currentStair: number
) {
  // Calculate stair position
  const stairIndex = Math.max(0, currentStair);
  const stairZ = STAIR_CONSTANTS.STAIRS_START_Z +
    stairIndex * (STAIR_CONSTANTS.STAIR_DEPTH + STAIR_CONSTANTS.STAIR_GAP);
  const stairY = stairIndex * STAIR_CONSTANTS.STAIR_HEIGHT;

  // Camera follows player up stairs from side angle
  state.targetPosition.set(
    STAIR_CAMERA_OFFSET.x * (1 - stairIndex * 0.05), // Gradually move closer
    STAIR_CAMERA_OFFSET.y + stairY * 0.6, // Rise with stairs
    stairZ + STAIR_CAMERA_OFFSET.z
  );

  // Look at player position on stairs
  state.targetLookAt.set(
    0,
    stairY + 2,
    stairZ + STAIR_CONSTANTS.STAIR_DEPTH / 2
  );

  state.transitionProgress = Math.min(state.transitionProgress + delta * 0.3, 1);
}

// Handle camera during celebration phase
function handleCelebrationCamera(
  state: ReturnType<typeof useRef<any>>['current'],
  delta: number,
  finalStair: number
) {
  // Calculate final stair position
  const stairZ = STAIR_CONSTANTS.STAIRS_START_Z +
    Math.max(0, finalStair - 1) * (STAIR_CONSTANTS.STAIR_DEPTH + STAIR_CONSTANTS.STAIR_GAP);
  const stairY = Math.max(0, finalStair - 1) * STAIR_CONSTANTS.STAIR_HEIGHT;

  // Slow circular camera movement around the player
  state.celebrationAngle += delta * 0.3;

  const radius = 15;
  const cameraX = Math.sin(state.celebrationAngle) * radius;
  const cameraZ = stairZ + Math.cos(state.celebrationAngle) * radius - 5;

  state.targetPosition.set(
    cameraX,
    CELEBRATION_CAMERA_OFFSET.y + stairY * 0.5,
    cameraZ
  );

  // Always look at the final stair position
  state.targetLookAt.set(
    0,
    stairY + 3,
    stairZ
  );
}
