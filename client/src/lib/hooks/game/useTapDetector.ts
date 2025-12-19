import { useEffect, useCallback, useRef } from 'react';

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
