/**
 * Opponent Character Component - Renders opponent with 50% transparency
 * Used in PvP matches to display the other player
 */
import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, MeshStandardMaterial } from 'three';
import { PVP_CONSTANTS, PlayerState } from '../../../shared/types/pvp.types';

interface OpponentCharacterProps {
  opponentState: PlayerState | null;
  skin?: string;
}

export function OpponentCharacter({ opponentState, skin = 'default' }: OpponentCharacterProps) {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<MeshStandardMaterial>(null);

  // Set up transparent material
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.transparent = true;
      materialRef.current.opacity = PVP_CONSTANTS.OPPONENT_OPACITY;
    }
  }, []);

  // Update position from opponent state
  useFrame(() => {
    if (meshRef.current && opponentState) {
      // Update position
      meshRef.current.position.set(
        opponentState.position.x,
        opponentState.position.y,
        opponentState.position.z
      );

      // Update lane position (smooth transition)
      const targetX = opponentState.lane * 2; // Assuming lanes are 2 units apart
      meshRef.current.position.x += (targetX - meshRef.current.position.x) * 0.2;
    }
  });

  if (!opponentState || !opponentState.isAlive) {
    return null; // Don't render if dead
  }

  return (
    <group>
      {/* Main character body */}
      <mesh ref={meshRef} position={[0, 1, 0]} castShadow>
        <boxGeometry args={[0.8, 1.6, 0.8]} />
        <meshStandardMaterial
          ref={materialRef}
          color={getSkinColor(skin)}
          transparent
          opacity={PVP_CONSTANTS.OPPONENT_OPACITY}
        />
      </mesh>

      {/* Optional: Glow/outline effect */}
      <mesh position={[opponentState.position.x, opponentState.position.y + 1, opponentState.position.z]}>
        <boxGeometry args={[1, 1.8, 1]} />
        <meshBasicMaterial
          color="#00ff88"
          transparent
          opacity={0.1}
          depthWrite={false}
        />
      </mesh>

      {/* Soldier count indicator */}
      {opponentState.soldiers > 0 && (
        <group position={[0, 2.5, 0]}>
          {/* Simplified soldier count display - would be replaced with actual soldier rendering */}
          <mesh>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial
              color="#ffffff"
              transparent
              opacity={PVP_CONSTANTS.OPPONENT_OPACITY}
              emissive="#ffffff"
              emissiveIntensity={0.2}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

/**
 * Get color for skin
 */
function getSkinColor(skin: string): string {
  const skinColors: Record<string, string> = {
    default: '#ff6b6b',
    blue: '#4dabf7',
    green: '#51cf66',
    purple: '#cc5de8',
    gold: '#ffd43b',
    red: '#ff6b6b'
  };

  return skinColors[skin] || skinColors.default;
}

export default OpponentCharacter;
