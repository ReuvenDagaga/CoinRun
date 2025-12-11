import { forwardRef } from 'react';
import * as THREE from 'three';

// Shared character model - used for Player, Soldiers, and Army
// All characters should look IDENTICAL

interface CharacterModelProps {
  color?: string;
  scale?: number;
  isAnimating?: boolean; // Whether to show running animation
}

// Character model component - matches Player appearance exactly
const CharacterModel = forwardRef<THREE.Group, CharacterModelProps>(
  ({ color = '#4ECDC4', scale = 1.0, isAnimating = false }, ref) => {
    return (
      <group ref={ref} scale={scale}>
        {/* Main body - capsule shape */}
        <mesh castShadow>
          <capsuleGeometry args={[0.35, 0.6, 8, 16]} />
          <meshStandardMaterial
            color={color}
            metalness={0.3}
            roughness={0.7}
          />
        </mesh>

        {/* Head */}
        <mesh position={[0, 0.7, 0]} castShadow>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial
            color="#45B7D1"
            metalness={0.4}
            roughness={0.6}
          />
        </mesh>

        {/* Eyes - facing forward (positive Z) */}
        <mesh position={[0.1, 0.75, 0.2]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="white" />
        </mesh>
        <mesh position={[-0.1, 0.75, 0.2]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="white" />
        </mesh>

        {/* Pupils */}
        <mesh position={[0.1, 0.75, 0.24]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshBasicMaterial color="black" />
        </mesh>
        <mesh position={[-0.1, 0.75, 0.24]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshBasicMaterial color="black" />
        </mesh>
      </group>
    );
  }
);

CharacterModel.displayName = 'CharacterModel';

export default CharacterModel;

// Default player color
export const PLAYER_COLOR = '#4ECDC4';
