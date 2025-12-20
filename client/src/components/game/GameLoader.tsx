import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { generateTrackLayout } from './TrackLayoutManager';
import BaseLoading from '../ui/BaseLoading';

// Warm-up scene to pre-compile shaders
const WarmupScene = memo(function WarmupScene({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    // Allow one frame for render, then signal complete
    const timer = setTimeout(onComplete, 100);
    return () => clearTimeout(timer);
  }, [onComplete]);

  // Create sample materials to warm up shaders
  const materials = useMemo(() => [
    new THREE.MeshStandardMaterial({ color: '#CC2222', roughness: 0.6 }),
    new THREE.MeshStandardMaterial({ color: '#00FF88', emissive: '#00FF88', emissiveIntensity: 1 }),
    new THREE.MeshStandardMaterial({ color: '#7A7A7A', roughness: 0.8 }),
    new THREE.MeshStandardMaterial({ color: '#4A0080', roughness: 0.7 }),
    new THREE.MeshStandardMaterial({ color: '#00FFFF', emissive: '#00FFFF', emissiveIntensity: 2 }),
  ], []);

  return (
    <group position={[0, -100, 0]}>
      {/* Off-screen render of sample geometries to warm up GPU */}
      {materials.map((mat, i) => (
        <mesh key={i} position={[i * 2, 0, 0]} material={mat}>
          <boxGeometry args={[1, 1, 1]} />
        </mesh>
      ))}
      <mesh position={[10, 0, 0]}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial color="#FF0000" emissive="#FF0000" emissiveIntensity={1} />
      </mesh>
      <mesh position={[12, 0, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 2, 12]} />
        <meshStandardMaterial color="#8B4513" roughness={0.7} />
      </mesh>
      <mesh position={[14, 0, 0]}>
        <capsuleGeometry args={[0.5, 1, 8, 12]} />
        <meshStandardMaterial color="#4A0080" roughness={0.7} />
      </mesh>
      {/* Lights */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} />
      <pointLight position={[0, 5, 0]} color="#00FFFF" intensity={2} />
    </group>
  );
});

export interface PreloadedData {
  enemies: any[];
  gates: any[];
  coins: any[];
  soldiers: any[];
}

interface GameLoaderProps {
  onLoadComplete: (data: PreloadedData) => void;
  trackLength: number;
}

export function GameLoader({
  onLoadComplete,
  trackLength,
}: GameLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'initializing' | 'generating' | 'warming-up' | 'ready' | 'starting'>('initializing');
  const [shaderWarmedUp, setShaderWarmedUp] = useState(false);
  const [preloadedData, setPreloadedData] = useState<PreloadedData | null>(null);

  // Pre-generate all game data using smart placement system
  useEffect(() => {
    const loadData = async () => {
      setPhase('initializing');
      setProgress(10);
      await new Promise(resolve => setTimeout(resolve, 50));

      // Use the smart placement system to generate everything together
      setPhase('generating');
      setProgress(30);
      await new Promise(resolve => setTimeout(resolve, 50));

      const layout = generateTrackLayout(trackLength);
      setProgress(70);

      await new Promise(resolve => setTimeout(resolve, 50));

      setPreloadedData({
        enemies: layout.enemies,
        gates: layout.gates,
        coins: layout.coins,
        soldiers: layout.soldiers,
      });

      setProgress(80);
      setPhase('warming-up');
    };

    loadData();
  }, [trackLength]);

  // Handle shader warmup complete
  const handleShaderWarmup = useCallback(() => {
    setShaderWarmedUp(true);
    setProgress(100);
    setPhase('ready');
  }, []);

  // Complete loading when everything is ready
  useEffect(() => {
    if (shaderWarmedUp && preloadedData) {
      // Small delay to show 100%
      const timer = setTimeout(() => {
        setPhase('starting');
        onLoadComplete(preloadedData);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [shaderWarmedUp, preloadedData, onLoadComplete]);

  // Map phase to user-friendly message
  const getLoadingMessage = () => {
    switch (phase) {
      case 'initializing':
        return 'Initializing game...';
      case 'generating':
        return 'Generating track...';
      case 'warming-up':
        return 'Warming up...';
      case 'ready':
        return 'Ready!';
      case 'starting':
        return 'Starting game...';
      default:
        return 'Loading...';
    }
  };

  return (
    <>
      <BaseLoading message={getLoadingMessage()} progress={progress} />

      {/* Hidden canvas for shader warmup */}
      {preloadedData && !shaderWarmedUp && (
        <div className="absolute opacity-0 pointer-events-none w-1 h-1 overflow-hidden">
          <Canvas
            gl={{ powerPreference: 'high-performance' }}
            frameloop="demand"
          >
            <WarmupScene onComplete={handleShaderWarmup} />
          </Canvas>
        </div>
      )}
    </>
  );
}

// Object pool for dead soldiers
export class DeadSoldierPool {
  private pool: any[] = [];
  private activeCount = 0;
  private maxSize: number;

  constructor(maxSize: number = 50) {
    this.maxSize = maxSize;
  }

  acquire(data: any): any {
    if (this.pool.length > 0) {
      const item = this.pool.pop();
      Object.assign(item, data);
      this.activeCount++;
      return item;
    }
    this.activeCount++;
    return { ...data };
  }

  release(item: any): void {
    if (this.pool.length < this.maxSize) {
      this.pool.push(item);
    }
    this.activeCount--;
  }

  clear(): void {
    this.pool = [];
    this.activeCount = 0;
  }

  get size(): number {
    return this.pool.length;
  }

  get active(): number {
    return this.activeCount;
  }
}

export default GameLoader;
