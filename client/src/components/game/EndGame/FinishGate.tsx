import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TRACK_LENGTH, TRACK_WIDTH } from '../Track/config';

// Finish gate constants
const GATE_Z = TRACK_LENGTH - 5; // 5m before track end
const GATE_WIDTH = TRACK_WIDTH + 4; // Wider than track
const GATE_HEIGHT = 12;
const POLE_RADIUS = 0.4;
const ARCH_SEGMENTS = 32;

// Colors
const GOLD_COLOR = '#FFD700';
const GOLD_EMISSIVE = '#FFA500';
const WHITE_COLOR = '#FFFFFF';
const DARK_COLOR = '#1a1a1a';

export default function FinishGate() {
  const gateRef = useRef<THREE.Group>(null);
  const starRef = useRef<THREE.Group>(null);
  const ribbonRef = useRef<THREE.Group>(null);

  // Animate gate elements
  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Slowly rotate the star
    if (starRef.current) {
      starRef.current.rotation.y = time * 0.5;
      starRef.current.position.y = GATE_HEIGHT + 1.5 + Math.sin(time * 2) * 0.1;
    }

    // Wave the ribbons
    if (ribbonRef.current) {
      ribbonRef.current.children.forEach((ribbon, i) => {
        ribbon.rotation.z = Math.sin(time * 3 + i * 0.5) * 0.1;
      });
    }
  });

  // Create arch geometry
  const archGeometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-GATE_WIDTH / 2, 0, 0),
      new THREE.Vector3(-GATE_WIDTH / 2, GATE_HEIGHT * 0.8, 0),
      new THREE.Vector3(0, GATE_HEIGHT, 0),
      new THREE.Vector3(GATE_WIDTH / 2, GATE_HEIGHT * 0.8, 0),
      new THREE.Vector3(GATE_WIDTH / 2, 0, 0),
    ]);
    return new THREE.TubeGeometry(curve, ARCH_SEGMENTS, POLE_RADIUS, 8, false);
  }, []);

  return (
    <group ref={gateRef} position={[0, 0, GATE_Z]}>
      {/* Left pole */}
      <mesh position={[-GATE_WIDTH / 2, GATE_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[POLE_RADIUS, POLE_RADIUS * 1.2, GATE_HEIGHT, 16]} />
        <meshStandardMaterial
          color={GOLD_COLOR}
          emissive={GOLD_EMISSIVE}
          emissiveIntensity={0.3}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Right pole */}
      <mesh position={[GATE_WIDTH / 2, GATE_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[POLE_RADIUS, POLE_RADIUS * 1.2, GATE_HEIGHT, 16]} />
        <meshStandardMaterial
          color={GOLD_COLOR}
          emissive={GOLD_EMISSIVE}
          emissiveIntensity={0.3}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Arch */}
      <mesh geometry={archGeometry}>
        <meshStandardMaterial
          color={GOLD_COLOR}
          emissive={GOLD_EMISSIVE}
          emissiveIntensity={0.3}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Checkered banner */}
      <CheckeredBanner />

      {/* "FINISH" text frame - transparent center */}
      <group position={[0, GATE_HEIGHT - 1.5, 0.2]}>
        {/* Top border */}
        <mesh position={[0, 0.65, 0]}>
          <boxGeometry args={[6, 0.2, 0.15]} />
          <meshStandardMaterial color={GOLD_COLOR} emissive={GOLD_EMISSIVE} emissiveIntensity={0.3} metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Bottom border */}
        <mesh position={[0, -0.65, 0]}>
          <boxGeometry args={[6, 0.2, 0.15]} />
          <meshStandardMaterial color={GOLD_COLOR} emissive={GOLD_EMISSIVE} emissiveIntensity={0.3} metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Left border */}
        <mesh position={[-2.9, 0, 0]}>
          <boxGeometry args={[0.2, 1.5, 0.15]} />
          <meshStandardMaterial color={GOLD_COLOR} emissive={GOLD_EMISSIVE} emissiveIntensity={0.3} metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Right border */}
        <mesh position={[2.9, 0, 0]}>
          <boxGeometry args={[0.2, 1.5, 0.15]} />
          <meshStandardMaterial color={GOLD_COLOR} emissive={GOLD_EMISSIVE} emissiveIntensity={0.3} metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* Decorative star on top */}
      <group ref={starRef} position={[0, GATE_HEIGHT + 1.5, 0]}>
        <Star />
      </group>

      {/* Side ribbons */}
      <group ref={ribbonRef}>
        <Ribbon position={[-GATE_WIDTH / 2 - 0.5, GATE_HEIGHT * 0.7, 0]} color="#FF0000" />
        <Ribbon position={[-GATE_WIDTH / 2 - 0.5, GATE_HEIGHT * 0.5, 0]} color="#FFD700" />
        <Ribbon position={[GATE_WIDTH / 2 + 0.5, GATE_HEIGHT * 0.7, 0]} color="#FF0000" />
        <Ribbon position={[GATE_WIDTH / 2 + 0.5, GATE_HEIGHT * 0.5, 0]} color="#FFD700" />
      </group>

      {/* Pole top spheres */}
      <mesh position={[-GATE_WIDTH / 2, GATE_HEIGHT + 0.5, 0]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial
          color={GOLD_COLOR}
          emissive={GOLD_EMISSIVE}
          emissiveIntensity={0.5}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      <mesh position={[GATE_WIDTH / 2, GATE_HEIGHT + 0.5, 0]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial
          color={GOLD_COLOR}
          emissive={GOLD_EMISSIVE}
          emissiveIntensity={0.5}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Ground highlight */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[GATE_WIDTH + 2, 4]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

// Checkered banner component
function CheckeredBanner() {
  const CHECKER_SIZE = 0.5;
  const BANNER_WIDTH = 8;
  const BANNER_HEIGHT = 4;
  const rows = Math.floor(BANNER_HEIGHT / CHECKER_SIZE);
  const cols = Math.floor(BANNER_WIDTH / CHECKER_SIZE);

  return (
    <group position={[0, GATE_HEIGHT - 4, 0.1]}>
      {/* Banner frame - thin border only, no solid blocking */}
      <mesh position={[0, BANNER_HEIGHT / 2 + 0.15, -0.05]}>
        <boxGeometry args={[BANNER_WIDTH + 0.4, 0.2, 0.1]} />
        <meshStandardMaterial color={DARK_COLOR} />
      </mesh>
      <mesh position={[0, -BANNER_HEIGHT / 2 - 0.15, -0.05]}>
        <boxGeometry args={[BANNER_WIDTH + 0.4, 0.2, 0.1]} />
        <meshStandardMaterial color={DARK_COLOR} />
      </mesh>
      <mesh position={[-BANNER_WIDTH / 2 - 0.15, 0, -0.05]}>
        <boxGeometry args={[0.2, BANNER_HEIGHT + 0.4, 0.1]} />
        <meshStandardMaterial color={DARK_COLOR} />
      </mesh>
      <mesh position={[BANNER_WIDTH / 2 + 0.15, 0, -0.05]}>
        <boxGeometry args={[0.2, BANNER_HEIGHT + 0.4, 0.1]} />
        <meshStandardMaterial color={DARK_COLOR} />
      </mesh>

      {/* Checkers */}
      {Array.from({ length: rows * cols }, (_, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const isBlack = (row + col) % 2 === 0;
        const x = (col - cols / 2 + 0.5) * CHECKER_SIZE;
        const y = (row - rows / 2 + 0.5) * CHECKER_SIZE;

        return (
          <mesh key={`checker-${i}`} position={[x, y, 0]}>
            <boxGeometry args={[CHECKER_SIZE - 0.02, CHECKER_SIZE - 0.02, 0.12]} />
            <meshStandardMaterial
              color={isBlack ? '#000000' : WHITE_COLOR}
              emissive={isBlack ? '#000000' : '#333333'}
              emissiveIntensity={0.2}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// Star decoration component
function Star() {
  const points = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    const outerRadius = 1;
    const innerRadius = 0.4;
    const numPoints = 5;

    for (let i = 0; i < numPoints * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / numPoints - Math.PI / 2;
      pts.push(new THREE.Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius));
    }
    return pts;
  }, []);

  const starShape = useMemo(() => {
    const shape = new THREE.Shape(points);
    return shape;
  }, [points]);

  return (
    <mesh rotation={[0, 0, 0]}>
      <extrudeGeometry
        args={[
          starShape,
          { depth: 0.3, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05 },
        ]}
      />
      <meshStandardMaterial
        color={GOLD_COLOR}
        emissive={GOLD_EMISSIVE}
        emissiveIntensity={0.6}
        metalness={0.9}
        roughness={0.1}
      />
    </mesh>
  );
}

// Ribbon decoration component
interface RibbonProps {
  position: [number, number, number];
  color: string;
}

function Ribbon({ position, color }: RibbonProps) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.3, 2, 0.05]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </mesh>
      {/* Ribbon end */}
      <mesh position={[0, -1.2, 0]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[0.15, 0.5, 0.05]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, -1.2, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <boxGeometry args={[0.15, 0.5, 0.05]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}
