// TieredSoldierModel.tsx - Soldier model with tier-based visual upgrades
import { memo, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getSoldierTierVisuals, TieredSoldier } from './SoldierTierSystem';
import { AnimationState } from '../characters/types';

interface TieredSoldierModelProps {
  soldier: TieredSoldier;
  skinColors: {
    skin: string;
    shirt: string;
    pants: string;
    shoes: string;
    hair: string;
  };
  animation?: AnimationState;
}

export const TieredSoldierModel = memo(function TieredSoldierModel({
  soldier,
  skinColors,
  animation = 'running',
}: TieredSoldierModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const tier = getSoldierTierVisuals(soldier.value);

  // Animation state
  const animRef = useRef(0);

  useFrame((state, delta) => {
    animRef.current += delta * 8; // Animation speed

    if (groupRef.current && animation !== 'idle') {
      // Simple bobbing animation
      groupRef.current.position.y = Math.abs(Math.sin(animRef.current)) * 0.1;
    }

    // Pulsing glow effect
    if (glowRef.current && tier.hasGlow) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.3;
      glowRef.current.intensity = (tier.glowIntensity || 0.5) * pulse;
    }
  });

  // Materials
  const materials = useMemo(() => ({
    skin: new THREE.MeshStandardMaterial({ color: skinColors.skin }),
    shirt: new THREE.MeshStandardMaterial({ color: skinColors.shirt }),
    pants: new THREE.MeshStandardMaterial({ color: skinColors.pants }),
    shoes: new THREE.MeshStandardMaterial({ color: skinColors.shoes }),
    hair: new THREE.MeshStandardMaterial({ color: skinColors.hair }),
    armor: tier.hasArmor ? new THREE.MeshStandardMaterial({
      color: tier.armorColor || '#666666',
      metalness: 0.8,
      roughness: 0.2,
    }) : null,
    helmet: tier.hasHelmet ? new THREE.MeshStandardMaterial({
      color: tier.helmetColor || '#555555',
      metalness: 0.7,
      roughness: 0.3,
    }) : null,
    cape: tier.hasCape ? new THREE.MeshStandardMaterial({
      color: tier.capeColor || '#442222',
      side: THREE.DoubleSide,
    }) : null,
  }), [skinColors, tier]);

  const scale = tier.sizeMultiplier;

  return (
    <group ref={groupRef} scale={scale}>
      {/* Glow effect */}
      {tier.hasGlow && (
        <pointLight
          ref={glowRef}
          color={tier.glowColor}
          intensity={tier.glowIntensity || 0.5}
          distance={2}
          decay={2}
        />
      )}

      {/* Body */}
      <group position={[0, 0.6, 0]}>
        {/* Torso */}
        <mesh material={tier.hasArmor ? materials.armor! : materials.shirt}>
          <capsuleGeometry args={[0.15, 0.3, 8, 16]} />
        </mesh>

        {/* Armor chest plate */}
        {tier.hasArmor && (
          <mesh position={[0, 0, 0.1]} material={materials.armor!}>
            <boxGeometry args={[0.25, 0.35, 0.08]} />
          </mesh>
        )}

        {/* Head */}
        <group position={[0, 0.35, 0]}>
          <mesh material={materials.skin}>
            <sphereGeometry args={[0.12, 16, 16]} />
          </mesh>

          {/* Hair */}
          <mesh position={[0, 0.05, 0]} material={materials.hair}>
            <sphereGeometry args={[0.10, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>

          {/* Helmet */}
          {tier.hasHelmet && (
            <mesh position={[0, 0.02, 0]} material={materials.helmet!}>
              <sphereGeometry args={[0.14, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
            </mesh>
          )}

          {/* Eyes */}
          <mesh position={[-0.04, 0, 0.1]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshBasicMaterial color="white" />
          </mesh>
          <mesh position={[0.04, 0, 0.1]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshBasicMaterial color="white" />
          </mesh>
          <mesh position={[-0.04, 0, 0.11]}>
            <sphereGeometry args={[0.01, 6, 6]} />
            <meshBasicMaterial color="black" />
          </mesh>
          <mesh position={[0.04, 0, 0.11]}>
            <sphereGeometry args={[0.01, 6, 6]} />
            <meshBasicMaterial color="black" />
          </mesh>
        </group>

        {/* Arms */}
        <group position={[-0.22, 0.1, 0]}>
          <mesh material={materials.shirt}>
            <capsuleGeometry args={[0.05, 0.2, 6, 12]} />
          </mesh>
          {/* Shoulder armor */}
          {tier.hasArmor && (
            <mesh position={[0, 0.1, 0]} material={materials.armor!}>
              <sphereGeometry args={[0.08, 8, 8]} />
            </mesh>
          )}
        </group>
        <group position={[0.22, 0.1, 0]}>
          <mesh material={materials.shirt}>
            <capsuleGeometry args={[0.05, 0.2, 6, 12]} />
          </mesh>
          {tier.hasArmor && (
            <mesh position={[0, 0.1, 0]} material={materials.armor!}>
              <sphereGeometry args={[0.08, 8, 8]} />
            </mesh>
          )}
        </group>

        {/* Cape */}
        {tier.hasCape && (
          <mesh position={[0, 0.1, -0.15]} rotation={[0.2, 0, 0]} material={materials.cape!}>
            <planeGeometry args={[0.35, 0.5]} />
          </mesh>
        )}
      </group>

      {/* Legs */}
      <group position={[0, 0.2, 0]}>
        <mesh position={[-0.08, 0, 0]} material={materials.pants}>
          <capsuleGeometry args={[0.06, 0.25, 6, 12]} />
        </mesh>
        <mesh position={[0.08, 0, 0]} material={materials.pants}>
          <capsuleGeometry args={[0.06, 0.25, 6, 12]} />
        </mesh>
      </group>

      {/* Feet */}
      <mesh position={[-0.08, 0, 0.03]} material={materials.shoes}>
        <boxGeometry args={[0.08, 0.05, 0.12]} />
      </mesh>
      <mesh position={[0.08, 0, 0.03]} material={materials.shoes}>
        <boxGeometry args={[0.08, 0.05, 0.12]} />
      </mesh>

      {/* Value indicator - floating number */}
      {soldier.value > 1 && (
        <group position={[0, 1.2, 0]}>
          {/* Background circle */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.15, 16]} />
            <meshBasicMaterial color={tier.glowColor || '#ffffff'} transparent opacity={0.8} />
          </mesh>
        </group>
      )}
    </group>
  );
});

export default TieredSoldierModel;
