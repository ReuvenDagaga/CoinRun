import { useGame } from "@/context";
import { useMemo, memo } from "react";
import { getSeedValue, seededRandom } from "./utils";
import { SEGMENT_COUNT, SEGMENT_LENGTH, TRACK_THEMES, TRACK_WIDTH } from "./config";
import { CHUNK_CONFIG } from "../utils/ChunkManager";

interface TrackSegment {
    key: string;
    position: [number, number, number];
    size: [number, number, number];
    color: string;
    z: number; // Z position for chunk filtering
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
      const z = index * SEGMENT_LENGTH + SEGMENT_LENGTH / 2;
      return {
        key: `segment-${index}`,
        position: [0, -0.25, z] as [number, number, number],
        size: [TRACK_WIDTH, 0.5, SEGMENT_LENGTH] as [number, number, number],
        color: texture.color,
        z,
      };
    });
  }, [track?.seed]);
}

// Single segment mesh component - memoized
const SegmentMesh = memo(function SegmentMesh({
  segment
}: {
  segment: TrackSegment;
}) {
  return (
    <mesh key={segment.key} position={segment.position} receiveShadow>
      <boxGeometry args={segment.size} />
      <meshStandardMaterial color={segment.color} metalness={0.1} roughness={0.9} />
    </mesh>
  );
});

function TrackSegments({ segments }: { segments: TrackSegment[] }) {
  const { player } = useGame();

  // Only recompute visible segments when player moves significantly (every 20 units)
  const playerZBucket = Math.floor(player.position.z / 20) * 20;

  // Filter to only render segments near player
  const visibleSegments = useMemo(() => {
    const minZ = player.position.z - CHUNK_CONFIG.RENDER_BEHIND - SEGMENT_LENGTH;
    const maxZ = player.position.z + CHUNK_CONFIG.RENDER_AHEAD + SEGMENT_LENGTH;

    return segments.filter(
      (s) => s.z >= minZ && s.z <= maxZ
    );
  }, [segments, playerZBucket, player.position.z]);

  return (
    <>
      {visibleSegments.map((segment) => (
        <SegmentMesh key={segment.key} segment={segment} />
      ))}
    </>
  );
}

export default TrackSegments;
