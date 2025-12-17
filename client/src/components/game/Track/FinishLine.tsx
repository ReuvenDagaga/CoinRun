import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TRACK_LENGTH, TRACK_WIDTH } from './config';

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