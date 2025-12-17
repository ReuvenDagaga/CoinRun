import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/context';
import { STAIR_CONSTANTS } from '@shared/types/game.types';
import { TRACK_LENGTH } from '../Track/config';

// Confetti constants
const MAX_PARTICLES = 200;
const PARTICLE_COLORS = [
  '#FFD700', // Gold
  '#C0C0C0', // Silver
  '#FF0000', // Red
  '#0000FF', // Blue
  '#00FF00', // Green
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFA500', // Orange
  '#FF69B4', // Pink
  '#9400D3', // Violet
];

interface ConfettiParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: THREE.Euler;
  rotationSpeed: THREE.Vector3;
  color: string;
  scale: number;
  lifetime: number;
  maxLifetime: number;
  type: 'rectangle' | 'circle' | 'ribbon';
}

interface ConfettiProps {
  enabled?: boolean;
}

export default function Confetti({ enabled = true }: ConfettiProps) {
  const { status, endGameState } = useGame();
  const particlesRef = useRef<ConfettiParticle[]>([]);
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const lastSpawnTime = useRef(0);

  // Get intensity from endGameState
  const intensity = endGameState?.confettiIntensity || 0;

  // Initialize particle pool
  useEffect(() => {
    if (!enabled) return;

    particlesRef.current = [];
    meshRefs.current = new Array(MAX_PARTICLES).fill(null);
  }, [enabled]);

  // Spawn new particles based on intensity
  const spawnParticle = (baseZ: number, baseY: number) => {
    const particles = particlesRef.current;
    if (particles.length >= MAX_PARTICLES * intensity) return;

    const spreadX = 15;
    const spreadZ = 20;

    const particle: ConfettiParticle = {
      position: new THREE.Vector3(
        (Math.random() - 0.5) * spreadX,
        baseY + 15 + Math.random() * 5,
        baseZ + (Math.random() - 0.5) * spreadZ
      ),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        -3 - Math.random() * 2,
        (Math.random() - 0.5) * 2
      ),
      rotation: new THREE.Euler(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      ),
      rotationSpeed: new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 5
      ),
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      scale: 0.1 + Math.random() * 0.2,
      lifetime: 0,
      maxLifetime: 3 + Math.random() * 2,
      type: ['rectangle', 'circle', 'ribbon'][Math.floor(Math.random() * 3)] as ConfettiParticle['type'],
    };

    particles.push(particle);
  };

  // Animation frame
  useFrame((state, delta) => {
    if (!enabled || status !== 'endgame' || intensity <= 0) return;

    const particles = particlesRef.current;
    const time = state.clock.elapsedTime;

    // Calculate spawn position based on current stair
    const currentStair = endGameState?.currentStair || 0;
    const baseZ = STAIR_CONSTANTS.STAIRS_START_Z +
      currentStair * (STAIR_CONSTANTS.STAIR_DEPTH + STAIR_CONSTANTS.STAIR_GAP);
    const baseY = currentStair * STAIR_CONSTANTS.STAIR_HEIGHT;

    // Spawn particles at intervals based on intensity
    const spawnInterval = 0.05 / intensity; // Higher intensity = more frequent spawns
    if (time - lastSpawnTime.current > spawnInterval) {
      const spawnCount = Math.ceil(3 * intensity);
      for (let i = 0; i < spawnCount; i++) {
        spawnParticle(baseZ, baseY);
      }
      lastSpawnTime.current = time;
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];

      // Update lifetime
      particle.lifetime += delta;
      if (particle.lifetime > particle.maxLifetime) {
        particles.splice(i, 1);
        continue;
      }

      // Apply gravity and wind
      particle.velocity.y -= 2 * delta; // Gravity
      particle.velocity.x += Math.sin(time * 2 + i) * 0.5 * delta; // Wind sway

      // Update position
      particle.position.add(particle.velocity.clone().multiplyScalar(delta));

      // Update rotation
      particle.rotation.x += particle.rotationSpeed.x * delta;
      particle.rotation.y += particle.rotationSpeed.y * delta;
      particle.rotation.z += particle.rotationSpeed.z * delta;

      // Remove if below ground
      if (particle.position.y < 0) {
        particles.splice(i, 1);
      }
    }
  });

  // Don't render if not in end game or intensity is 0
  if (!enabled || status !== 'endgame' || intensity <= 0) {
    return null;
  }

  return (
    <group>
      {particlesRef.current.map((particle, index) => (
        <ConfettiPiece
          key={index}
          particle={particle}
        />
      ))}
    </group>
  );
}

// Individual confetti piece
interface ConfettiPieceProps {
  particle: ConfettiParticle;
}

function ConfettiPiece({ particle }: ConfettiPieceProps) {
  const { position, rotation, color, scale, type, lifetime, maxLifetime } = particle;

  // Fade out as lifetime expires
  const opacity = Math.min(1, (maxLifetime - lifetime) / 0.5);

  // Get geometry based on type
  const geometry = useMemo(() => {
    switch (type) {
      case 'rectangle':
        return <planeGeometry args={[1, 0.6]} />;
      case 'circle':
        return <circleGeometry args={[0.4, 8]} />;
      case 'ribbon':
        return <planeGeometry args={[0.3, 1.5]} />;
      default:
        return <planeGeometry args={[1, 0.6]} />;
    }
  }, [type]);

  return (
    <mesh
      position={[position.x, position.y, position.z]}
      rotation={[rotation.x, rotation.y, rotation.z]}
      scale={scale}
    >
      {geometry}
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.3}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Celebration burst effect
export function ConfettiBurst({ position, count = 50 }: { position: [number, number, number]; count?: number }) {
  const particlesRef = useRef<ConfettiParticle[]>([]);

  useEffect(() => {
    // Create burst of particles
    const particles: ConfettiParticle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 5 + Math.random() * 5;

      particles.push({
        position: new THREE.Vector3(position[0], position[1], position[2]),
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed * (0.5 + Math.random()),
          5 + Math.random() * 3,
          Math.sin(angle) * speed * (0.5 + Math.random())
        ),
        rotation: new THREE.Euler(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        ),
        rotationSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10
        ),
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        scale: 0.15 + Math.random() * 0.15,
        lifetime: 0,
        maxLifetime: 2 + Math.random(),
        type: ['rectangle', 'circle', 'ribbon'][Math.floor(Math.random() * 3)] as ConfettiParticle['type'],
      });
    }
    particlesRef.current = particles;
  }, [position, count]);

  useFrame((_, delta) => {
    const particles = particlesRef.current;

    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];

      particle.lifetime += delta;
      if (particle.lifetime > particle.maxLifetime) {
        particles.splice(i, 1);
        continue;
      }

      particle.velocity.y -= 10 * delta;
      particle.position.add(particle.velocity.clone().multiplyScalar(delta));

      particle.rotation.x += particle.rotationSpeed.x * delta;
      particle.rotation.y += particle.rotationSpeed.y * delta;
      particle.rotation.z += particle.rotationSpeed.z * delta;
    }
  });

  return (
    <group>
      {particlesRef.current.map((particle, index) => (
        <ConfettiPiece key={index} particle={particle} />
      ))}
    </group>
  );
}
