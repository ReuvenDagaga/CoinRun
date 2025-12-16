import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';

// Loading screen component
interface LoadingScreenProps {
  progress: number;
  message: string;
}

export const LoadingScreen = memo(function LoadingScreen({ progress, message }: LoadingScreenProps) {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col items-center justify-center z-50">
      {/* Title */}
      <h1 className="text-4xl font-bold text-white mb-8">CoinRun</h1>

      {/* Loading spinner */}
      <div className="relative w-24 h-24 mb-6">
        <div className="absolute inset-0 border-4 border-gray-600 rounded-full" />
        <div
          className="absolute inset-0 border-4 border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"
          style={{ animationDuration: '0.8s' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-bold text-lg">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600 transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Loading message */}
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  );
});

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
  generateEnemies: (trackLength: number) => any[];
  generateGates: (trackLength: number) => any[];
  generateCoins: (trackLength: number) => any[];
  generateSoldiers: (trackLength: number) => any[];
  trackLength: number;
}

export function GameLoader({
  onLoadComplete,
  generateEnemies,
  generateGates,
  generateCoins,
  generateSoldiers,
  trackLength,
}: GameLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Initializing...');
  const [shaderWarmedUp, setShaderWarmedUp] = useState(false);
  const [preloadedData, setPreloadedData] = useState<PreloadedData | null>(null);

  // Pre-generate all game data
  useEffect(() => {
    const loadData = async () => {
      // Step 1: Generate enemies (20%)
      setMessage('Generating obstacles...');
      await new Promise(resolve => setTimeout(resolve, 50));
      const enemies = generateEnemies(trackLength);
      setProgress(20);

      // Step 2: Generate gates (40%)
      setMessage('Generating gates...');
      await new Promise(resolve => setTimeout(resolve, 50));
      const gates = generateGates(trackLength);
      setProgress(40);

      // Step 3: Generate coins (60%)
      setMessage('Generating coins...');
      await new Promise(resolve => setTimeout(resolve, 50));
      const coins = generateCoins(trackLength);
      setProgress(60);

      // Step 4: Generate soldiers (80%)
      setMessage('Generating soldiers...');
      await new Promise(resolve => setTimeout(resolve, 50));
      const soldiers = generateSoldiers(trackLength);
      setProgress(80);

      setPreloadedData({ enemies, gates, coins, soldiers });
      setMessage('Warming up shaders...');
    };

    loadData();
  }, [generateEnemies, generateGates, generateCoins, generateSoldiers, trackLength]);

  // Handle shader warmup complete
  const handleShaderWarmup = useCallback(() => {
    setShaderWarmedUp(true);
    setProgress(100);
    setMessage('Ready!');
  }, []);

  // Complete loading when everything is ready
  useEffect(() => {
    if (shaderWarmedUp && preloadedData) {
      // Small delay to show 100%
      const timer = setTimeout(() => {
        onLoadComplete(preloadedData);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [shaderWarmedUp, preloadedData, onLoadComplete]);

  return (
    <>
      <LoadingScreen progress={progress} message={message} />

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

// Object pool for projectiles
export class ProjectilePool {
  private pool: any[] = [];
  private activeCount = 0;
  private maxSize: number;

  constructor(maxSize: number = 20) {
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
}

export default GameLoader;
