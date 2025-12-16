import { useRef, memo, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  SHOOTER_CONFIG,
  SHOOTER_HEIGHT,
  SHOOTER_WIDTH,
  SHOOTER_WARNING_TIME,
} from '../types';
import { GROUND_Y } from '../../../Player';

interface EnemyShooterProps {
  fireRate: number;
  onFire: () => void;
}

export const EnemyShooter = memo(function EnemyShooter({
  fireRate,
  onFire,
}: EnemyShooterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const weaponRef = useRef<THREE.Mesh>(null);
  const eyeLeftRef = useRef<THREE.Mesh>(null);
  const eyeRightRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  const fireTimerRef = useRef(Math.random() * fireRate); // Random start offset
  const isChargingRef = useRef(false);

  const materials = useMemo(() => ({
    body: new THREE.MeshStandardMaterial({
      color: SHOOTER_CONFIG.bodyColor,
      roughness: 0.7,
      metalness: 0.2,
    }),
    bodyDark: new THREE.MeshStandardMaterial({
      color: '#2A0050',
      roughness: 0.8,
      metalness: 0.1,
    }),
    eye: new THREE.MeshStandardMaterial({
      color: SHOOTER_CONFIG.eyeColor,
      emissive: SHOOTER_CONFIG.eyeColor,
      emissiveIntensity: 1,
      roughness: 0.2,
    }),
    eyeCharging: new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      emissive: '#FFFFFF',
      emissiveIntensity: 3,
      roughness: 0.1,
    }),
    weapon: new THREE.MeshStandardMaterial({
      color: SHOOTER_CONFIG.weaponColor,
      roughness: 0.3,
      metalness: 0.9,
    }),
    glow: new THREE.MeshStandardMaterial({
      color: SHOOTER_CONFIG.glowColor,
      emissive: SHOOTER_CONFIG.glowColor,
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.7,
    }),
  }), []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    fireTimerRef.current += delta;

    // Check if charging (warning before fire)
    const timeUntilFire = fireRate - (fireTimerRef.current % fireRate);
    const isCharging = timeUntilFire <= SHOOTER_WARNING_TIME;

    // Update charging state and visuals
    if (isCharging !== isChargingRef.current) {
      isChargingRef.current = isCharging;

      // Change eye materials based on charging state
      if (eyeLeftRef.current && eyeRightRef.current) {
        const eyeMat = isCharging ? materials.eyeCharging : materials.eye;
        (eyeLeftRef.current as THREE.Mesh).material = eyeMat;
        (eyeRightRef.current as THREE.Mesh).material = eyeMat;
      }
    }

    // Weapon charging glow
    if (glowRef.current) {
      if (isCharging) {
        const chargeProgress = 1 - (timeUntilFire / SHOOTER_WARNING_TIME);
        glowRef.current.intensity = 2 + chargeProgress * 3;
      } else {
        glowRef.current.intensity = 0.5;
      }
    }

    // Fire projectile
    if (fireTimerRef.current >= fireRate) {
      fireTimerRef.current = 0;
      onFire();
    }

    // Idle animation - slight bobbing
    const bobOffset = Math.sin(state.clock.elapsedTime * 2) * 0.05;
    groupRef.current.position.y = GROUND_Y + SHOOTER_HEIGHT / 2 + bobOffset;

    // Weapon recoil animation after firing
    if (weaponRef.current) {
      const timeSinceFire = fireTimerRef.current;
      if (timeSinceFire < 0.2) {
        // Recoil back
        const recoil = Math.sin(timeSinceFire * Math.PI * 5) * 0.1;
        weaponRef.current.position.z = 0.3 + recoil;
      } else {
        weaponRef.current.position.z = 0.3;
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, GROUND_Y + SHOOTER_HEIGHT / 2, 0]}>
      {/* Main body - monster torso */}
      <mesh material={materials.body} castShadow>
        <capsuleGeometry args={[SHOOTER_WIDTH * 0.5, SHOOTER_HEIGHT * 0.4, 8, 12]} />
      </mesh>

      {/* Head */}
      <mesh
        position={[0, SHOOTER_HEIGHT * 0.4, 0]}
        material={materials.body}
        castShadow
      >
        <sphereGeometry args={[SHOOTER_WIDTH * 0.4, 12, 10]} />
      </mesh>

      {/* Eyes */}
      <mesh
        ref={eyeLeftRef}
        position={[-0.15, SHOOTER_HEIGHT * 0.45, 0.25]}
        material={materials.eye}
      >
        <sphereGeometry args={[0.1, 8, 6]} />
      </mesh>
      <mesh
        ref={eyeRightRef}
        position={[0.15, SHOOTER_HEIGHT * 0.45, 0.25]}
        material={materials.eye}
      >
        <sphereGeometry args={[0.1, 8, 6]} />
      </mesh>

      {/* Horns/ears */}
      <mesh
        position={[-0.3, SHOOTER_HEIGHT * 0.55, -0.1]}
        rotation={[0, 0, -Math.PI / 6]}
        material={materials.bodyDark}
        castShadow
      >
        <coneGeometry args={[0.1, 0.3, 6]} />
      </mesh>
      <mesh
        position={[0.3, SHOOTER_HEIGHT * 0.55, -0.1]}
        rotation={[0, 0, Math.PI / 6]}
        material={materials.bodyDark}
        castShadow
      >
        <coneGeometry args={[0.1, 0.3, 6]} />
      </mesh>

      {/* Arms holding weapon */}
      <mesh
        position={[-SHOOTER_WIDTH * 0.4, SHOOTER_HEIGHT * 0.1, 0.2]}
        rotation={[Math.PI / 4, 0, Math.PI / 6]}
        material={materials.bodyDark}
        castShadow
      >
        <capsuleGeometry args={[0.08, 0.4, 4, 8]} />
      </mesh>
      <mesh
        position={[SHOOTER_WIDTH * 0.4, SHOOTER_HEIGHT * 0.1, 0.2]}
        rotation={[Math.PI / 4, 0, -Math.PI / 6]}
        material={materials.bodyDark}
        castShadow
      >
        <capsuleGeometry args={[0.08, 0.4, 4, 8]} />
      </mesh>

      {/* Weapon (cannon/staff) */}
      <group ref={weaponRef} position={[0, SHOOTER_HEIGHT * 0.1, 0.3]}>
        {/* Barrel */}
        <mesh
          rotation={[Math.PI / 2, 0, 0]}
          material={materials.weapon}
          castShadow
        >
          <cylinderGeometry args={[0.12, 0.15, 0.8, 10]} />
        </mesh>

        {/* Muzzle */}
        <mesh
          position={[0, 0, 0.45]}
          rotation={[Math.PI / 2, 0, 0]}
          material={materials.weapon}
        >
          <cylinderGeometry args={[0.18, 0.12, 0.15, 10]} />
        </mesh>

        {/* Energy glow at muzzle */}
        <mesh
          position={[0, 0, 0.55]}
          material={materials.glow}
        >
          <sphereGeometry args={[0.1, 8, 6]} />
        </mesh>

        {/* Point light for charging effect */}
        <pointLight
          ref={glowRef}
          position={[0, 0, 0.6]}
          color={SHOOTER_CONFIG.glowColor}
          intensity={0.5}
          distance={3}
        />
      </group>

      {/* Legs/base */}
      <mesh
        position={[-0.2, -SHOOTER_HEIGHT * 0.35, 0]}
        material={materials.bodyDark}
        castShadow
      >
        <capsuleGeometry args={[0.1, 0.4, 4, 8]} />
      </mesh>
      <mesh
        position={[0.2, -SHOOTER_HEIGHT * 0.35, 0]}
        material={materials.bodyDark}
        castShadow
      >
        <capsuleGeometry args={[0.1, 0.4, 4, 8]} />
      </mesh>
    </group>
  );
});

export default EnemyShooter;
