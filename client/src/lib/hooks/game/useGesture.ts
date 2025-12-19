import { useEffect, useCallback, useRef } from 'react';

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
