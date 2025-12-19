import { useEffect, useCallback, useRef } from 'react';
import type { SwipeDirection } from '@shared/types/game.types';

interface SwipeConfig {
  minSwipeDistance: number;
  maxSwipeTime: number;
  onSwipe: (direction: SwipeDirection) => void;
  onSwipeEnd?: () => void; // Called when touch/key ends for continuous movement
}

interface TouchData {
  startX: number;
  startY: number;
  startTime: number;
  currentX: number;
  currentY: number;
  isMoving: boolean;
}

export function useSwipeDetector(config: SwipeConfig) {
  const touchDataRef = useRef<TouchData | null>(null);
  const activeDirectionRef = useRef<'left' | 'right' | null>(null);
  const { minSwipeDistance = 30, maxSwipeTime = 300, onSwipe, onSwipeEnd } = config;

  // Handle touch start - begin tracking
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    touchDataRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      currentX: touch.clientX,
      currentY: touch.clientY,
      isMoving: false
    };
  }, []);

  // Handle touch move - continuous horizontal movement
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchDataRef.current) return;

    const touch = e.touches[0];
    touchDataRef.current.currentX = touch.clientX;
    touchDataRef.current.currentY = touch.clientY;

    const deltaX = touch.clientX - touchDataRef.current.startX;
    const absX = Math.abs(deltaX);

    // Threshold for continuous movement
    const movementThreshold = 20;

    if (absX > movementThreshold) {
      touchDataRef.current.isMoving = true;
      const newDirection = deltaX > 0 ? 'right' : 'left';

      // Only trigger if direction changed
      if (activeDirectionRef.current !== newDirection) {
        activeDirectionRef.current = newDirection;
        onSwipe(newDirection);
      }
    }
  }, [onSwipe]);

  // Handle touch end
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchDataRef.current) return;

    const touch = e.changedTouches[0];
    const { startX, startY, startTime, isMoving } = touchDataRef.current;

    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    const deltaTime = Date.now() - startTime;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // If was in continuous movement, stop it
    if (isMoving || activeDirectionRef.current) {
      activeDirectionRef.current = null;
      onSwipeEnd?.();
    }

    // Quick swipe detection for jump (swipe up)
    if (deltaTime <= maxSwipeTime) {
      if (absY > minSwipeDistance && absY > absX && deltaY < 0) {
        // Swipe up - jump
        onSwipe('up');
      } else if (!isMoving && absX > minSwipeDistance && absX > absY) {
        // Quick horizontal swipe (not continuous movement)
        // Trigger single direction change then stop
        onSwipe(deltaX > 0 ? 'right' : 'left');
        setTimeout(() => onSwipeEnd?.(), 100);
      }
    }

    touchDataRef.current = null;
  }, [minSwipeDistance, maxSwipeTime, onSwipe, onSwipeEnd]);

  // Handle touch cancel
  const handleTouchCancel = useCallback(() => {
    if (activeDirectionRef.current) {
      activeDirectionRef.current = null;
      onSwipeEnd?.();
    }
    touchDataRef.current = null;
  }, [onSwipeEnd]);

  // Keyboard controls for desktop - with key hold support
  const activeKeysRef = useRef<Set<string>>(new Set());

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (activeKeysRef.current.has(e.key)) return; // Prevent repeat
    activeKeysRef.current.add(e.key);

    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        onSwipe('left');
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        onSwipe('right');
        break;
      case 'ArrowUp':
      case 'w':
      case 'W':
      case ' ':
        onSwipe('up');
        break;
    }
  }, [onSwipe]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    activeKeysRef.current.delete(e.key);

    // Check if this was a horizontal movement key
    const isHorizontalKey = ['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(e.key);

    if (isHorizontalKey) {
      // Check if other horizontal key is still held
      const leftKeys = ['ArrowLeft', 'a', 'A'];
      const rightKeys = ['ArrowRight', 'd', 'D'];

      const leftHeld = leftKeys.some(k => activeKeysRef.current.has(k));
      const rightHeld = rightKeys.some(k => activeKeysRef.current.has(k));

      if (!leftHeld && !rightHeld) {
        // No horizontal keys held, stop movement
        onSwipeEnd?.();
      } else if (leftHeld) {
        // Left is still held
        onSwipe('left');
      } else if (rightHeld) {
        // Right is still held
        onSwipe('right');
      }
    }
  }, [onSwipe, onSwipeEnd]);

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('touchcancel', handleTouchCancel, { passive: true });
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchCancel);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel, handleKeyDown, handleKeyUp]);
}
