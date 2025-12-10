import { useEffect, useCallback, useRef } from 'react';
import type { SwipeDirection } from '@shared/types/game.types';

interface SwipeConfig {
  minSwipeDistance: number;
  maxSwipeTime: number;
  onSwipe: (direction: SwipeDirection) => void;
}

interface TouchData {
  startX: number;
  startY: number;
  startTime: number;
}

export function useSwipeDetector(config: SwipeConfig) {
  const touchDataRef = useRef<TouchData | null>(null);
  const { minSwipeDistance = 30, maxSwipeTime = 300, onSwipe } = config;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    touchDataRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now()
    };
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchDataRef.current) return;

    const touch = e.changedTouches[0];
    const { startX, startY, startTime } = touchDataRef.current;

    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    const deltaTime = Date.now() - startTime;

    // Check if swipe was quick enough
    if (deltaTime > maxSwipeTime) {
      touchDataRef.current = null;
      return;
    }

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Determine swipe direction
    if (absX > minSwipeDistance || absY > minSwipeDistance) {
      if (absX > absY) {
        // Horizontal swipe
        onSwipe(deltaX > 0 ? 'right' : 'left');
      } else {
        // Vertical swipe
        if (deltaY < 0) {
          // Swipe up
          onSwipe('up');
        }
        // Ignore swipe down
      }
    }

    touchDataRef.current = null;
  }, [minSwipeDistance, maxSwipeTime, onSwipe]);

  // Keyboard controls for desktop
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
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

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleTouchStart, handleTouchEnd, handleKeyDown]);
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
