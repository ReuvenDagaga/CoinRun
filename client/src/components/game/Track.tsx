import { useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { GAME_CONSTANTS, SectionType } from '@shared/types/game.types';
import { COLORS } from '@/utils/constants';

// Section colors for visual variety - BRIGHT CASUAL STYLE
const SECTION_COLORS: Record<SectionType, string> = {
  [SectionType.INTRO]: '#D2691E',      // Chocolate brown
  [SectionType.EASY]: '#8B4513',       // Saddle brown
  [SectionType.COMBAT]: '#CD853F',     // Peru (tan)
  [SectionType.PLATFORMING]: '#A0522D', // Sienna
  [SectionType.BONUS]: '#DEB887',      // Burlywood (light)
  [SectionType.HARD_COMBAT]: '#8B0000', // Dark red accent
  [SectionType.SPEED]: '#DAA520',      // Goldenrod
  [SectionType.COLLECTION]: '#F4A460', // Sandy brown
  [SectionType.GAUNTLET]: '#BC8F8F',   // Rosy brown
  [SectionType.FINISH]: '#228B22'      // Forest green (finish!)
};

export default function Track() {
  const track = useGameStore((state) => state.track);

  // Use new wider track width (10m) for free movement
  const trackWidth = GAME_CONSTANTS.TRACK_WIDTH;

  // Generate track segments
  const segments = useMemo(() => {
    if (!track) return [];

    return track.sections.map((section, index) => {
      const startZ = section.startZ;
      const length = GAME_CONSTANTS.SECTION_LENGTH;
      const color = SECTION_COLORS[section.type];

      return {
        key: `section-${index}`,
        position: [0, -0.5, startZ + length / 2] as [number, number, number],
        size: [trackWidth, 1, length] as [number, number, number],
        color
      };
    });
  }, [track, trackWidth]);

  // Grass strips on sides of track
  const grassStrips = useMemo(() => {
    if (!track) return [];

    const totalLength = track.totalLength;

    return [
      // Left grass
      {
        position: [-(trackWidth / 2 + 5), -0.4, totalLength / 2] as [number, number, number],
        size: [10, 0.2, totalLength] as [number, number, number]
      },
      // Right grass
      {
        position: [trackWidth / 2 + 5, -0.4, totalLength / 2] as [number, number, number],
        size: [10, 0.2, totalLength] as [number, number, number]
      }
    ];
  }, [track, trackWidth]);

  // Track borders (walls)
  const borders = useMemo(() => {
    if (!track) return [];

    const totalLength = track.totalLength;
    const borderHeight = 2;

    return [
      // Left border
      {
        key: 'border-left',
        position: [-(trackWidth / 2 + 0.5), borderHeight / 2, totalLength / 2] as [number, number, number],
        size: [1, borderHeight, totalLength] as [number, number, number]
      },
      // Right border
      {
        key: 'border-right',
        position: [trackWidth / 2 + 0.5, borderHeight / 2, totalLength / 2] as [number, number, number],
        size: [1, borderHeight, totalLength] as [number, number, number]
      }
    ];
  }, [track, trackWidth]);

  if (!track) return null;

  return (
    <group>
      {/* Main track segments */}
      {segments.map((segment) => (
        <RigidBody
          key={segment.key}
          type="fixed"
          position={segment.position}
          userData="ground"
        >
          <mesh receiveShadow>
            <boxGeometry args={segment.size} />
            <meshStandardMaterial
              color={segment.color}
              metalness={0.1}
              roughness={0.9}
            />
          </mesh>
        </RigidBody>
      ))}

      {/* Track edge indicators (no lane dividers - free movement!) */}
      {/* Left edge glow */}
      <mesh
        position={[-trackWidth / 2 + 0.2, 0.02, track.totalLength / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[0.3, track.totalLength]} />
        <meshBasicMaterial color="#FF6B35" transparent opacity={0.4} />
      </mesh>
      {/* Right edge glow */}
      <mesh
        position={[trackWidth / 2 - 0.2, 0.02, track.totalLength / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[0.3, track.totalLength]} />
        <meshBasicMaterial color="#FF6B35" transparent opacity={0.4} />
      </mesh>

      {/* Track borders */}
      {borders.map((border) => (
        <RigidBody
          key={border.key}
          type="fixed"
          position={border.position}
        >
          <mesh>
            <boxGeometry args={border.size} />
            <meshStandardMaterial
              color={COLORS.LANE_BORDER}
              transparent
              opacity={0.3}
            />
          </mesh>
        </RigidBody>
      ))}

      {/* Finish line */}
      <mesh
        position={[0, 0.02, track.totalLength - 5]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[trackWidth, 5]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.5} />
      </mesh>

      {/* Finish text */}
      <mesh position={[0, 2, track.totalLength - 3]}>
        <boxGeometry args={[trackWidth, 3, 0.5]} />
        <meshStandardMaterial
          color="#22c55e"
          emissive="#22c55e"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Distance markers every 200m */}
      {Array.from({ length: 10 }, (_, i) => (
        <group key={`marker-${i}`} position={[-(trackWidth / 2 + 2), 0, (i + 1) * 200]}>
          <mesh position={[0, 1, 0]}>
            <boxGeometry args={[1, 2, 0.2]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Ground plane that extends beyond the track for visual appeal - BRIGHT CASUAL STYLE
export function Environment() {
  return (
    <group>
      {/* Extended grass ground */}
      <mesh position={[0, -1, 1000]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 2500]} />
        <meshStandardMaterial color={COLORS.TRACK_GRASS} />
      </mesh>

      {/* Sky dome - Bright blue sky gradient */}
      <mesh position={[0, 0, 1000]}>
        <sphereGeometry args={[500, 32, 32]} />
        <meshBasicMaterial
          color={COLORS.SKY_TOP}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Second sky layer for gradient effect */}
      <mesh position={[0, -100, 1000]}>
        <sphereGeometry args={[490, 32, 16]} />
        <meshBasicMaterial
          color={COLORS.SKY_BOTTOM}
          side={THREE.BackSide}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Light fog effect for depth */}
      <fog attach="fog" args={[COLORS.FOG, 100, 400]} />

      {/* Bright ambient light */}
      <ambientLight intensity={0.6} />

      {/* Main directional light (sun) */}
      <directionalLight
        position={[15, 30, 15]}
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

      {/* Hemisphere light - sky blue + grass green */}
      <hemisphereLight
        args={[COLORS.SKY_TOP, COLORS.TRACK_GRASS, 0.4]}
      />

      {/* Fill light from behind */}
      <directionalLight
        position={[-10, 10, -20]}
        intensity={0.3}
        color="#87CEEB"
      />
    </group>
  );
}
