import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/context';

// Track configuration
const TRACK_LENGTH = 800; // Total track length in meters
const SEGMENT_COUNT = 16; // Number of segments
const SEGMENT_LENGTH = TRACK_LENGTH / SEGMENT_COUNT; // 50m per segment
const TRACK_WIDTH = 10; // 10m wide

// Random track texture colors (simulating different textures)
const TRACK_TEXTURES = [
  { name: 'Red Brick', color: '#8B4513', pattern: 'brick' },
  { name: 'Wooden Planks', color: '#DEB887', pattern: 'wood' },
  { name: 'Stone Tiles', color: '#708090', pattern: 'stone' },
  { name: 'Dirt Path', color: '#8B7355', pattern: 'dirt' },
  { name: 'Grass', color: '#228B22', pattern: 'grass' },
  { name: 'Sand', color: '#F4A460', pattern: 'sand' },
  { name: 'Concrete', color: '#A9A9A9', pattern: 'concrete' },
  { name: 'Checkered', color: '#CD853F', pattern: 'checkered' },
];

// Seeded random for consistent textures per game
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

export default function Track() {
  const { track } = useGame();

  // Generate segments with random textures
  const segments = useMemo(() => {
    // Use track seed or current time for randomization
    const seedValue = track?.seed ?
      track.seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0) :
      Date.now();
    const random = seededRandom(seedValue);

    return Array.from({ length: SEGMENT_COUNT }, (_, index) => {
      const texture = TRACK_TEXTURES[Math.floor(random() * TRACK_TEXTURES.length)];
      return {
        key: `segment-${index}`,
        position: [0, -0.25, index * SEGMENT_LENGTH + SEGMENT_LENGTH / 2] as [number, number, number],
        size: [TRACK_WIDTH, 0.5, SEGMENT_LENGTH] as [number, number, number],
        color: texture.color,
        pattern: texture.pattern,
      };
    });
  }, [track?.seed]);

  // Edge glow strips
  const edgeColor = '#FF6B35'; // Orange warning color

  return (
    <group>
      {/* Main track segments */}
      {segments.map((segment) => (
        <mesh
          key={segment.key}
          position={segment.position}
          receiveShadow
        >
          <boxGeometry args={segment.size} />
          <meshStandardMaterial
            color={segment.color}
            metalness={0.1}
            roughness={0.9}
          />
        </mesh>
      ))}

      {/* Track edge indicators - Left */}
      <mesh
        position={[-TRACK_WIDTH / 2 + 0.15, 0.01, TRACK_LENGTH / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[0.3, TRACK_LENGTH]} />
        <meshBasicMaterial color={edgeColor} transparent opacity={0.6} />
      </mesh>

      {/* Track edge indicators - Right */}
      <mesh
        position={[TRACK_WIDTH / 2 - 0.15, 0.01, TRACK_LENGTH / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[0.3, TRACK_LENGTH]} />
        <meshBasicMaterial color={edgeColor} transparent opacity={0.6} />
      </mesh>

      {/* Distance markers every 100m */}
      {Array.from({ length: 8 }, (_, i) => (
        <group key={`marker-${i}`} position={[-(TRACK_WIDTH / 2 + 2), 0, (i + 1) * 100]}>
          <mesh position={[0, 1, 0]}>
            <boxGeometry args={[0.8, 2, 0.2]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          {/* Distance text marker post */}
          <mesh position={[0, 2.2, 0]}>
            <boxGeometry args={[1.2, 0.4, 0.2]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
        </group>
      ))}

      {/* Finish Line */}
      <FinishLine />
    </group>
  );
}

// Finish Line Component - Checkered flag style
function FinishLine() {
  const flagRef = useRef<THREE.Group>(null);

  // Gentle wave animation
  useFrame((state) => {
    if (flagRef.current) {
      flagRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  const FINISH_Z = TRACK_LENGTH - 5; // 5m before end

  // Create checkered pattern for flag
  const checkerSize = 0.5;
  const flagWidth = 8;
  const flagHeight = 6;
  const rows = Math.floor(flagHeight / checkerSize);
  const cols = Math.floor(flagWidth / checkerSize);

  return (
    <group position={[0, 0, FINISH_Z]}>
      {/* Ground checkered finish line */}
      <mesh
        position={[0, 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[TRACK_WIDTH, 4]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.7} />
      </mesh>

      {/* Flag pole - Left */}
      <mesh position={[-TRACK_WIDTH / 2 - 0.5, 4, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 8, 16]} />
        <meshStandardMaterial color="#8B4513" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Flag pole - Right */}
      <mesh position={[TRACK_WIDTH / 2 + 0.5, 4, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 8, 16]} />
        <meshStandardMaterial color="#8B4513" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Checkered Flag Banner */}
      <group ref={flagRef} position={[0, 6, 0]}>
        {/* Flag background */}
        <mesh position={[0, 0, -0.05]}>
          <boxGeometry args={[flagWidth + 0.4, flagHeight + 0.4, 0.1]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>

        {/* Checkered squares */}
        {Array.from({ length: rows * cols }, (_, i) => {
          const row = Math.floor(i / cols);
          const col = i % cols;
          const isBlack = (row + col) % 2 === 0;
          const x = (col - cols / 2 + 0.5) * checkerSize;
          const y = (row - rows / 2 + 0.5) * checkerSize;

          return (
            <mesh key={`checker-${i}`} position={[x, y, 0]}>
              <boxGeometry args={[checkerSize - 0.02, checkerSize - 0.02, 0.12]} />
              <meshStandardMaterial
                color={isBlack ? '#000000' : '#ffffff'}
                emissive={isBlack ? '#000000' : '#333333'}
                emissiveIntensity={0.2}
              />
            </mesh>
          );
        })}

        {/* FINISH text */}
        <mesh position={[0, -flagHeight / 2 - 0.8, 0]}>
          <boxGeometry args={[4, 1, 0.2]} />
          <meshStandardMaterial
            color="#22c55e"
            emissive="#22c55e"
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>

      {/* Celebratory poles with colored tops */}
      <mesh position={[-TRACK_WIDTH / 2 - 0.5, 8.2, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[TRACK_WIDTH / 2 + 0.5, 8.2, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

// Random skybox/background textures
const SKYBOX_COLORS = [
  { sky: '#87CEEB', horizon: '#4A90E2', name: 'Clear Day' },
  { sky: '#FF7F50', horizon: '#FF4500', name: 'Sunset' },
  { sky: '#191970', horizon: '#000080', name: 'Night Sky' },
  { sky: '#E0BBE4', horizon: '#957DAD', name: 'Twilight' },
  { sky: '#98FB98', horizon: '#32CD32', name: 'Aurora' },
  { sky: '#FFE4B5', horizon: '#DEB887', name: 'Desert' },
  { sky: '#B0E0E6', horizon: '#5F9EA0', name: 'Overcast' },
];

// Environment component with random background
export function Environment() {
  const { track } = useGame();

  // Get random sky based on track seed
  const skyColors = useMemo(() => {
    const seedValue = track?.seed ?
      track.seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0) :
      Date.now();
    const random = seededRandom(seedValue + 1000); // Different seed than track
    return SKYBOX_COLORS[Math.floor(random() * SKYBOX_COLORS.length)];
  }, [track?.seed]);

  return (
    <group>
      {/* Extended grass ground on sides */}
      <mesh position={[-15, -0.3, TRACK_LENGTH / 2]} receiveShadow>
        <boxGeometry args={[20, 0.2, TRACK_LENGTH + 100]} />
        <meshStandardMaterial color="#7CFC00" />
      </mesh>
      <mesh position={[15, -0.3, TRACK_LENGTH / 2]} receiveShadow>
        <boxGeometry args={[20, 0.2, TRACK_LENGTH + 100]} />
        <meshStandardMaterial color="#7CFC00" />
      </mesh>

      {/* Ground plane extending further */}
      <mesh position={[0, -1, TRACK_LENGTH / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, TRACK_LENGTH + 200]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>

      {/* Sky dome - Primary color */}
      <mesh position={[0, 0, TRACK_LENGTH / 2]}>
        <sphereGeometry args={[500, 32, 32]} />
        <meshBasicMaterial
          color={skyColors.sky}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Sky dome - Horizon gradient effect */}
      <mesh position={[0, -100, TRACK_LENGTH / 2]}>
        <sphereGeometry args={[490, 32, 16]} />
        <meshBasicMaterial
          color={skyColors.horizon}
          side={THREE.BackSide}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Fog for depth */}
      <fog attach="fog" args={[skyColors.horizon, 100, 500]} />

      {/* Lighting */}
      <ambientLight intensity={0.6} />

      {/* Main sun light */}
      <directionalLight
        position={[15, 30, TRACK_LENGTH / 4]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={150}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        color="#fff5e6"
      />

      {/* Hemisphere light - sky to ground */}
      <hemisphereLight
        args={[skyColors.sky, '#228B22', 0.4]}
      />

      {/* Fill light from behind */}
      <directionalLight
        position={[-10, 10, TRACK_LENGTH * 0.75]}
        intensity={0.3}
        color="#87CEEB"
      />

      {/* Decorative elements on sides - simple trees/bushes */}
      <TrackDecorations />
    </group>
  );
}

// Simple decorative elements along the track
function TrackDecorations() {
  const { track } = useGame();

  const decorations = useMemo(() => {
    const seedValue = track?.seed ?
      track.seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0) :
      Date.now();
    const random = seededRandom(seedValue + 2000);

    const items: Array<{ position: [number, number, number]; scale: number; color: string }> = [];

    // Add trees/bushes every ~30m on both sides
    for (let z = 20; z < TRACK_LENGTH; z += 30 + random() * 20) {
      // Left side
      items.push({
        position: [-12 - random() * 5, 0, z],
        scale: 1 + random() * 0.5,
        color: random() > 0.5 ? '#228B22' : '#32CD32',
      });
      // Right side
      items.push({
        position: [12 + random() * 5, 0, z + random() * 15],
        scale: 1 + random() * 0.5,
        color: random() > 0.5 ? '#228B22' : '#32CD32',
      });
    }

    return items;
  }, [track?.seed]);

  return (
    <group>
      {decorations.map((dec, i) => (
        <group key={`deco-${i}`} position={dec.position}>
          {/* Simple tree - trunk */}
          <mesh position={[0, dec.scale * 0.8, 0]}>
            <cylinderGeometry args={[0.2, 0.3, dec.scale * 1.6, 8]} />
            <meshStandardMaterial color="#8B4513" />
          </mesh>
          {/* Tree - foliage */}
          <mesh position={[0, dec.scale * 2, 0]}>
            <coneGeometry args={[dec.scale * 0.8, dec.scale * 2, 8]} />
            <meshStandardMaterial color={dec.color} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
