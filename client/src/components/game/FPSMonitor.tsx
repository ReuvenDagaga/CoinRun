import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';

// FPS Monitor - tracks and displays frame rate
export function FPSMonitor() {
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const [fps, setFps] = useState(60);
  const [avgFps, setAvgFps] = useState(60);
  const fpsHistory = useRef<number[]>([]);

  useFrame(() => {
    frameCount.current++;
    const now = performance.now();
    const elapsed = now - lastTime.current;

    // Update FPS every 500ms
    if (elapsed >= 500) {
      const currentFps = Math.round((frameCount.current / elapsed) * 1000);
      setFps(currentFps);

      // Track FPS history for average
      fpsHistory.current.push(currentFps);
      if (fpsHistory.current.length > 20) {
        fpsHistory.current.shift();
      }

      // Calculate average
      const avg = fpsHistory.current.reduce((a, b) => a + b, 0) / fpsHistory.current.length;
      setAvgFps(Math.round(avg));

      frameCount.current = 0;
      lastTime.current = now;
    }
  });

  return null; // This is a Three.js component, UI is rendered separately
}

// HTML overlay FPS display
interface FPSDisplayProps {
  show?: boolean;
}

export function FPSDisplay({ show = true }: FPSDisplayProps) {
  const [fps, setFps] = useState(60);
  const [avgFps, setAvgFps] = useState(60);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const fpsHistory = useRef<number[]>([]);

  useEffect(() => {
    if (!show) return;

    let animationId: number;

    const measureFps = () => {
      frameCount.current++;
      const now = performance.now();
      const elapsed = now - lastTime.current;

      if (elapsed >= 500) {
        const currentFps = Math.round((frameCount.current / elapsed) * 1000);
        setFps(currentFps);

        fpsHistory.current.push(currentFps);
        if (fpsHistory.current.length > 20) {
          fpsHistory.current.shift();
        }

        const avg = fpsHistory.current.reduce((a, b) => a + b, 0) / fpsHistory.current.length;
        setAvgFps(Math.round(avg));

        frameCount.current = 0;
        lastTime.current = now;
      }

      animationId = requestAnimationFrame(measureFps);
    };

    animationId = requestAnimationFrame(measureFps);

    return () => cancelAnimationFrame(animationId);
  }, [show]);

  if (!show) return null;

  const fpsColor = fps >= 55 ? '#22c55e' : fps >= 30 ? '#eab308' : '#ef4444';

  return (
    <div
      style={{
        position: 'absolute',
        top: 10,
        right: 10,
        padding: '8px 12px',
        background: 'rgba(0, 0, 0, 0.7)',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '14px',
        color: fpsColor,
        zIndex: 1000,
        pointerEvents: 'none'
      }}
    >
      <div>FPS: {fps}</div>
      <div style={{ fontSize: '12px', opacity: 0.7 }}>AVG: {avgFps}</div>
    </div>
  );
}

export default FPSDisplay;
