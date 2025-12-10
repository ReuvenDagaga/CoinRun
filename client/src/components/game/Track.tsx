import { useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { GAME_CONSTANTS, SectionType } from '@shared/types/game.types';
import { COLORS } from '@/utils/constants';

// Section colors for visual variety
const SECTION_COLORS: Record<SectionType, string> = {
  [SectionType.INTRO]: '#1e3a5f',
  [SectionType.EASY]: '#1e4620',
  [SectionType.COMBAT]: '#4a1c1c',
  [SectionType.PLATFORMING]: '#3d3d1c',
  [SectionType.BONUS]: '#4a3a1c',
  [SectionType.HARD_COMBAT]: '#4a0d0d',
  [SectionType.SPEED]: '#1c3d4a',
  [SectionType.COLLECTION]: '#4a4a0d',
  [SectionType.GAUNTLET]: '#3d1c4a',
  [SectionType.FINISH]: '#0d4a1c'
};

export default function Track() {
  const track = useGameStore((state) => state.track);

  const trackWidth = GAME_CONSTANTS.LANE_WIDTH * GAME_CONSTANTS.LANE_COUNT;

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

  // Lane dividers
  const laneLines = useMemo(() => {
    if (!track) return [];

    const lines: { position: [number, number, number]; length: number }[] = [];
    const totalLength = track.totalLength;

    // Left lane divider
    lines.push({
      position: [-GAME_CONSTANTS.LANE_WIDTH, 0.01, totalLength / 2],
      length: totalLength
    });

    // Right lane divider
    lines.push({
      position: [GAME_CONSTANTS.LANE_WIDTH, 0.01, totalLength / 2],
      length: totalLength
    });

    return lines;
  }, [track]);

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

      {/* Lane dividers */}
      {laneLines.map((line, index) => (
        <mesh
          key={`lane-${index}`}
          position={line.position}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.1, line.length]} />
          <meshBasicMaterial
            color={COLORS.LANE_BORDER}
            transparent
            opacity={0.5}
          />
        </mesh>
      ))}

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

// Ground plane that extends beyond the track for visual appeal
export function Environment() {
  return (
    <group>
      {/* Extended ground */}
      <mesh position={[0, -1, 1000]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 2500]} />
        <meshStandardMaterial color={COLORS.GROUND} />
      </mesh>

      {/* Sky dome */}
      <mesh position={[0, 0, 1000]}>
        <sphereGeometry args={[500, 32, 32]} />
        <meshBasicMaterial
          color={COLORS.SKY_TOP}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Fog effect */}
      <fog attach="fog" args={[COLORS.FOG, 50, 200]} />

      {/* Ambient light */}
      <ambientLight intensity={0.4} />

      {/* Main directional light */}
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={100}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />

      {/* Hemisphere light for ambient */}
      <hemisphereLight
        args={[COLORS.SKY_TOP, COLORS.GROUND, 0.3]}
      />
    </group>
  );
}
