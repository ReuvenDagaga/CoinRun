import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TRACK_LENGTH, TRACK_WIDTH } from './config';

const CHECKER_SIZE = 0.5;
const FLAG_WIDTH = 8;
const FLAG_HEIGHT = 6;
const FINISH_OFFSET = 5;

export default function FinishLine() {
  const flagRef = useRef<THREE.Group>(null);
  const finishZ = TRACK_LENGTH - FINISH_OFFSET;

  useFrame((state) => {
    if (flagRef.current) {
      flagRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <group position={[0, 0, finishZ]}>
      <GroundLine />
      <FlagPoles />
      <CheckeredBanner ref={flagRef} />
      <PoleTopSpheres />
    </group>
  );
}

function GroundLine() {
  return (
    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[TRACK_WIDTH, 4]} />
      <meshBasicMaterial color="#22c55e" transparent opacity={0.7} />
    </mesh>
  );
}

function FlagPoles() {
  const poleProps = {
    geometry: <cylinderGeometry args={[0.1, 0.1, 8, 16]} />,
    material: <meshStandardMaterial color="#8B4513" metalness={0.6} roughness={0.4} />,
  };

  return (
    <>
      <mesh position={[-TRACK_WIDTH / 2 - 0.5, 4, 0]}>
        {poleProps.geometry}
        {poleProps.material}
      </mesh>
      <mesh position={[TRACK_WIDTH / 2 + 0.5, 4, 0]}>
        {poleProps.geometry}
        {poleProps.material}
      </mesh>
    </>
  );
}

import { forwardRef } from 'react';

const CheckeredBanner = forwardRef<THREE.Group>((_, ref) => {
  const rows = Math.floor(FLAG_HEIGHT / CHECKER_SIZE);
  const cols = Math.floor(FLAG_WIDTH / CHECKER_SIZE);

  return (
    <group ref={ref} position={[0, 6, 0]}>
      {/* Removed black background - only thin frame border now */}
      {/* Top border */}
      <mesh position={[0, FLAG_HEIGHT / 2 + 0.15, -0.05]}>
        <boxGeometry args={[FLAG_WIDTH + 0.4, 0.2, 0.1]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Bottom border */}
      <mesh position={[0, -FLAG_HEIGHT / 2 - 0.15, -0.05]}>
        <boxGeometry args={[FLAG_WIDTH + 0.4, 0.2, 0.1]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Left border */}
      <mesh position={[-FLAG_WIDTH / 2 - 0.15, 0, -0.05]}>
        <boxGeometry args={[0.2, FLAG_HEIGHT + 0.4, 0.1]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Right border */}
      <mesh position={[FLAG_WIDTH / 2 + 0.15, 0, -0.05]}>
        <boxGeometry args={[0.2, FLAG_HEIGHT + 0.4, 0.1]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

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
              color={isBlack ? '#000000' : '#ffffff'}
              emissive={isBlack ? '#000000' : '#333333'}
              emissiveIntensity={0.2}
            />
          </mesh>
        );
      })}

      <mesh position={[0, -FLAG_HEIGHT / 2 - 0.8, 0]}>
        <boxGeometry args={[4, 1, 0.2]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
});

CheckeredBanner.displayName = 'CheckeredBanner';

function PoleTopSpheres() {
  const sphereProps = {
    geometry: <sphereGeometry args={[0.3, 16, 16]} />,
    material: <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.3} />,
  };

  return (
    <>
      <mesh position={[-TRACK_WIDTH / 2 - 0.5, 8.2, 0]}>
        {sphereProps.geometry}
        {sphereProps.material}
      </mesh>
      <mesh position={[TRACK_WIDTH / 2 + 0.5, 8.2, 0]}>
        {sphereProps.geometry}
        {sphereProps.material}
      </mesh>
    </>
  );
}