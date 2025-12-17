import { useMemo } from 'react';
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

/**
 * Simple finish gate - just pillars and arch (like a doorframe)
 * No banners, flags, or decorations blocking the view
 */
export default function FinishGate() {
  // Create arch geometry (top connecting bar)
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
    <group position={[0, 0, GATE_Z]}>
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

      {/* Arch (top connecting bar) */}
      <mesh geometry={archGeometry}>
        <meshStandardMaterial
          color={GOLD_COLOR}
          emissive={GOLD_EMISSIVE}
          emissiveIntensity={0.3}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

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
    </group>
  );
}
