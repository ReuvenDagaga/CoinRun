import { useGame } from "@/context";
import { useMemo } from "react";
import { getSeedValue, seededRandom } from "./utils";
import { SEGMENT_COUNT, SEGMENT_LENGTH, TRACK_THEMES, TRACK_WIDTH } from "./config";

interface TrackSegment {
    key: string;
    position: [number, number, number];
    size: [number, number, number];
    color: string;
}

export function useTrackSegments(): TrackSegment[] {
  const { track } = useGame();

  return useMemo(() => {
    const seedValue = getSeedValue(track?.seed);
    const random = seededRandom(seedValue);

    const theme = TRACK_THEMES[Math.floor(random() * TRACK_THEMES.length)];
    const textures = theme.textures;

    return Array.from({ length: SEGMENT_COUNT }, (_, index) => {
      const texture = textures[Math.floor(random() * textures.length)];
      return {
        key: `segment-${index}`,
        position: [0, -0.25, index * SEGMENT_LENGTH + SEGMENT_LENGTH / 2],
        size: [TRACK_WIDTH, 0.5, SEGMENT_LENGTH],
        color: texture.color,
      };
    });
  }, [track?.seed]);
}



function TrackSegments({ segments }: { segments: TrackSegment[] }) {
    return (
        <>
            {segments.map((segment) => (
                <mesh key={segment.key} position={segment.position} receiveShadow>
                    <boxGeometry args={segment.size} />
                    <meshStandardMaterial color={segment.color} metalness={0.1} roughness={0.9} />
                </mesh>
            ))}
        </>
    );
}

export default TrackSegments;