import { useRef, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/context';
import { STAIR_CONSTANTS, calculateMaxStair } from '@shared/types/game.types';
import { TRACK_LENGTH } from '../Track/config';
import { CharacterModel, CharacterModelRef } from '../characters';
import { useAuth } from '@/hooks/useAuth';

// Animation timing constants
const CLIMB_DURATION = 0.8; // seconds per stair
const PAUSE_DURATION = 0.3; // pause between stairs
const FINISH_DELAY = 2.0; // delay before showing rewards

interface StairClimbControllerProps {
  onComplete?: () => void;
}

export default function StairClimbController({ onComplete }: StairClimbControllerProps) {
  const {
    status,
    player,
    endGameState,
    startEndGame,
    climbStair,
    completeEndGame,
    updateEndGamePhase,
  } = useGame();
  const { user } = useAuth();

  const playerRef = useRef<THREE.Group>(null);
  const characterRef = useRef<CharacterModelRef>(null);
  const currentSkin = user?.currentSkin || user?.ownedSkins?.[0] || 'default';

  // Animation state
  const animationState = useRef({
    isClimbing: false,
    currentStairIndex: -1,
    targetStairIndex: -1,
    maxReachableStair: 0,
    climbProgress: 0,
    pauseTimer: 0,
    finishTimer: 0,
    startPosition: { x: 0, y: 0.5, z: TRACK_LENGTH },
    targetPosition: { x: 0, y: 0.5, z: TRACK_LENGTH },
    hasStarted: false,
    isFinished: false,
  });

  // Calculate max reachable stair when entering end game
  useEffect(() => {
    if (status === 'endgame' && endGameState?.phase === 'entering' && !animationState.current.hasStarted) {
      const maxStair = calculateMaxStair(player.armyCount);
      animationState.current.maxReachableStair = maxStair;
      animationState.current.hasStarted = true;

      // Set initial position
      if (playerRef.current) {
        playerRef.current.position.set(0, 0.5, TRACK_LENGTH);
      }

      // Start animation
      characterRef.current?.setAnimation('running');

      // Transition to climbing phase after brief delay
      setTimeout(() => {
        updateEndGamePhase('climbing');
        startEndGame();
      }, 500);
    }
  }, [status, endGameState?.phase, player.armyCount, startEndGame, updateEndGamePhase]);

  // Handle climb completion
  const handleClimbComplete = useCallback(() => {
    if (animationState.current.isFinished) return;
    animationState.current.isFinished = true;

    // Set idle animation
    characterRef.current?.setAnimation('idle');

    // Wait before showing rewards
    setTimeout(() => {
      updateEndGamePhase('finished');
      completeEndGame();
      onComplete?.();
    }, FINISH_DELAY * 1000);
  }, [completeEndGame, updateEndGamePhase, onComplete]);

  // Main animation frame
  useFrame((_, delta) => {
    if (!playerRef.current || status !== 'endgame' || !endGameState) return;

    const anim = animationState.current;

    // Handle different phases
    switch (endGameState.phase) {
      case 'entering':
        // Walk towards stairs
        handleEnteringPhase(delta);
        break;

      case 'climbing':
        // Climb stairs
        handleClimbingPhase(delta);
        break;

      case 'finished':
        // Stay at final position
        break;
    }
  });

  // Handle entering phase - walk to first stair
  const handleEnteringPhase = (delta: number) => {
    if (!playerRef.current) return;

    const anim = animationState.current;
    const targetZ = STAIR_CONSTANTS.STAIRS_START_Z;
    const currentZ = playerRef.current.position.z;

    if (currentZ < targetZ) {
      const speed = 10; // m/s
      playerRef.current.position.z = Math.min(currentZ + speed * delta, targetZ);
    }
  };

  // Handle climbing phase
  const handleClimbingPhase = (delta: number) => {
    if (!playerRef.current) return;

    const anim = animationState.current;

    // Handle pause between stairs
    if (anim.pauseTimer > 0) {
      anim.pauseTimer -= delta;
      return;
    }

    // Check if we need to start climbing next stair
    if (!anim.isClimbing) {
      const nextStair = anim.currentStairIndex + 1;

      // Check if we can climb the next stair
      if (nextStair < anim.maxReachableStair && nextStair < STAIR_CONSTANTS.TOTAL_STAIRS) {
        // Check if we have enough soldiers
        const cost = STAIR_CONSTANTS.STAIR_COSTS[nextStair];
        const remainingSoldiers = endGameState?.soldiersRemaining || 0;

        if (remainingSoldiers >= cost) {
          // Start climbing
          anim.isClimbing = true;
          anim.targetStairIndex = nextStair;
          anim.climbProgress = 0;

          // Set start and target positions
          anim.startPosition = {
            x: playerRef.current.position.x,
            y: playerRef.current.position.y,
            z: playerRef.current.position.z,
          };

          const stairPos = STAIR_CONSTANTS.STAIRS_START_Z +
            nextStair * (STAIR_CONSTANTS.STAIR_DEPTH + STAIR_CONSTANTS.STAIR_GAP);
          anim.targetPosition = {
            x: 0,
            y: nextStair * STAIR_CONSTANTS.STAIR_HEIGHT + 0.5 + STAIR_CONSTANTS.STAIR_HEIGHT,
            z: stairPos + STAIR_CONSTANTS.STAIR_DEPTH / 2,
          };

          // Set climbing animation
          characterRef.current?.setAnimation('running');
        } else {
          // Can't climb further - finish
          handleClimbComplete();
        }
      } else {
        // Reached max stair - finish
        handleClimbComplete();
      }
    }

    // Animate climbing
    if (anim.isClimbing) {
      anim.climbProgress += delta / CLIMB_DURATION;

      if (anim.climbProgress >= 1) {
        // Finished climbing this stair
        anim.climbProgress = 1;
        anim.isClimbing = false;
        anim.currentStairIndex = anim.targetStairIndex;

        // Register stair climb in game state
        climbStair(anim.currentStairIndex);

        // Set position exactly
        playerRef.current.position.set(
          anim.targetPosition.x,
          anim.targetPosition.y,
          anim.targetPosition.z
        );

        // Pause before next stair
        anim.pauseTimer = PAUSE_DURATION;

        // Set idle briefly
        characterRef.current?.setAnimation('idle');
      } else {
        // Interpolate position with easing
        const t = easeInOutQuad(anim.climbProgress);

        playerRef.current.position.set(
          THREE.MathUtils.lerp(anim.startPosition.x, anim.targetPosition.x, t),
          THREE.MathUtils.lerp(anim.startPosition.y, anim.targetPosition.y, t),
          THREE.MathUtils.lerp(anim.startPosition.z, anim.targetPosition.z, t)
        );
      }
    }
  };

  // Don't render if not in end game
  if (status !== 'endgame') {
    return null;
  }

  return (
    <group ref={playerRef} position={[0, 0.5, TRACK_LENGTH]}>
      <CharacterModel
        ref={characterRef}
        skinId={currentSkin}
        animation="running"
        scale={1.5}
      />
    </group>
  );
}

// Easing function for smooth animation
function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
