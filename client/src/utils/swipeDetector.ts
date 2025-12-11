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

// Hook for detecting tap (for shooting when bullets active)
export function useTapDetector(onTap: () => void) {
  const startTimeRef = useRef<number>(0);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    startTimeRef.current = Date.now();
    startPosRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!startPosRef.current) return;

    const touch = e.changedTouches[0];
    const deltaTime = Date.now() - startTimeRef.current;
    const deltaX = Math.abs(touch.clientX - startPosRef.current.x);
    const deltaY = Math.abs(touch.clientY - startPosRef.current.y);

    // Quick tap with minimal movement
    if (deltaTime < 200 && deltaX < 10 && deltaY < 10) {
      onTap();
    }

    startPosRef.current = null;
  }, [onTap]);

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);
}

// Utility to provide haptic feedback
export function vibrate(pattern: number | number[] = 10) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

// Gesture state for more complex gesture detection
export interface GestureState {
  isActive: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  velocityX: number;
  velocityY: number;
}

export function useGesture(onGestureUpdate?: (state: GestureState) => void) {
  const stateRef = useRef<GestureState>({
    isActive: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    deltaX: 0,
    deltaY: 0,
    velocityX: 0,
    velocityY: 0
  });

  const lastUpdateRef = useRef<number>(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    stateRef.current = {
      isActive: true,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX: 0,
      deltaY: 0,
      velocityX: 0,
      velocityY: 0
    };
    lastUpdateRef.current = Date.now();
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!stateRef.current.isActive) return;

    const touch = e.touches[0];
    const now = Date.now();
    const dt = (now - lastUpdateRef.current) / 1000;

    const newDeltaX = touch.clientX - stateRef.current.startX;
    const newDeltaY = touch.clientY - stateRef.current.startY;

    stateRef.current = {
      ...stateRef.current,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX: newDeltaX,
      deltaY: newDeltaY,
      velocityX: dt > 0 ? (newDeltaX - stateRef.current.deltaX) / dt : 0,
      velocityY: dt > 0 ? (newDeltaY - stateRef.current.deltaY) / dt : 0
    };

    lastUpdateRef.current = now;
    onGestureUpdate?.(stateRef.current);
  }, [onGestureUpdate]);

  const handleTouchEnd = useCallback(() => {
    stateRef.current = {
      ...stateRef.current,
      isActive: false
    };
    onGestureUpdate?.(stateRef.current);
  }, [onGestureUpdate]);

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return stateRef.current;
}
