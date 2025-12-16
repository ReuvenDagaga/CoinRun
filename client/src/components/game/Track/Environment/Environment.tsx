import { useMemo } from 'react';
import * as THREE from 'three';
import { useGame } from '@/context';
import { TRACK_LENGTH } from '../config';
import { getSeedValue, seededRandom } from '../utils';
import TrackDecorations from './TrackDecorations';

export interface SkyTheme {
  sky: string;
  horizon: string;
  name: string;
}

export const SKY_THEMES: SkyTheme[] = [
  { sky: '#87CEEB', horizon: '#4A90E2', name: 'Clear Day' },
  { sky: '#FF7F50', horizon: '#FF4500', name: 'Sunset' },
  { sky: '#191970', horizon: '#000080', name: 'Night Sky' },
  { sky: '#E0BBE4', horizon: '#957DAD', name: 'Twilight' },
  { sky: '#98FB98', horizon: '#32CD32', name: 'Aurora' },
  { sky: '#FFE4B5', horizon: '#DEB887', name: 'Desert' },
  { sky: '#B0E0E6', horizon: '#5F9EA0', name: 'Overcast' },
];

function useSkyTheme(): SkyTheme {
  const { track } = useGame();

  return useMemo(() => {
    const seedValue = getSeedValue(track?.seed) + 1000;
    const random = seededRandom(seedValue);
    return SKY_THEMES[Math.floor(random() * SKY_THEMES.length)];
  }, [track?.seed]);
}

interface SkyDomeProps {
  theme: SkyTheme;
}

function SkyDome({ theme }: SkyDomeProps) {
  return (
    <>
      <mesh position={[0, 0, TRACK_LENGTH / 2]}>
        <sphereGeometry args={[500, 32, 32]} />
        <meshBasicMaterial color={theme.sky} side={THREE.BackSide} />
      </mesh>
      <mesh position={[0, -100, TRACK_LENGTH / 2]}>
        <sphereGeometry args={[490, 32, 16]} />
        <meshBasicMaterial color={theme.horizon} side={THREE.BackSide} transparent opacity={0.4} />
      </mesh>
      <fog attach="fog" args={[theme.horizon, 100, 500]} />
    </>
  );
}

interface LightingProps {
  theme: SkyTheme;
}

function Lighting({ theme }: LightingProps) {
  return (
    <>
      <ambientLight intensity={0.6} />

      <directionalLight
        position={[15, 30, TRACK_LENGTH / 4]}
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

      <hemisphereLight args={[theme.sky, '#228B22', 0.4]} />

      <directionalLight
        position={[-10, 10, TRACK_LENGTH * 0.75]}
        intensity={0.3}
        color="#87CEEB"
      />
    </>
  );
}

function Ground() {
  return (
    <>
      <mesh position={[-15, -0.3, TRACK_LENGTH / 2]} receiveShadow>
        <boxGeometry args={[20, 0.2, TRACK_LENGTH + 100]} />
        <meshStandardMaterial color="#7CFC00" />
      </mesh>

      <mesh position={[15, -0.3, TRACK_LENGTH / 2]} receiveShadow>
        <boxGeometry args={[20, 0.2, TRACK_LENGTH + 100]} />
        <meshStandardMaterial color="#7CFC00" />
      </mesh>

      <mesh position={[0, -1, TRACK_LENGTH / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, TRACK_LENGTH + 200]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>
    </>
  );
}

export default function Environment() {
  const theme = useSkyTheme();

  return (
    <group>
      <Ground />
      <SkyDome theme={theme} />
      <Lighting theme={theme} />
      <TrackDecorations />
    </group>
  );
}

export { SkyDome, Lighting, Ground };