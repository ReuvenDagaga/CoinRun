import { useMemo, memo } from "react";
import { useGame } from "@/context";
import { COLORS, TRACK_LENGTH, TRACK_WIDTH } from "./config";
import { CHUNK_CONFIG } from "../utils/ChunkManager";

// Edge segment length (should match or be similar to track segment length)
const EDGE_SEGMENT_LENGTH = 50;
const TOTAL_EDGE_SEGMENTS = Math.ceil(TRACK_LENGTH / EDGE_SEGMENT_LENGTH);

interface EdgeSegmentData {
  z: number;
  index: number;
}

// Single edge segment pair - memoized
const EdgeSegmentPair = memo(function EdgeSegmentPair({
  segment
}: {
  segment: EdgeSegmentData;
}) {
  const zPos = segment.z + EDGE_SEGMENT_LENGTH / 2;

  return (
    <>
      {/* Left edge */}
      <mesh
        position={[-TRACK_WIDTH / 2 + 0.15, 0.01, zPos]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[0.3, EDGE_SEGMENT_LENGTH]} />
        <meshBasicMaterial color={COLORS.trackEdge} transparent opacity={0.6} />
      </mesh>
      {/* Right edge */}
      <mesh
        position={[TRACK_WIDTH / 2 - 0.15, 0.01, zPos]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[0.3, EDGE_SEGMENT_LENGTH]} />
        <meshBasicMaterial color={COLORS.trackEdge} transparent opacity={0.6} />
      </mesh>
    </>
  );
});

function TrackEdges() {
  const { player } = useGame();

  // Generate all edge segment positions once
  const allEdgeSegments = useMemo<EdgeSegmentData[]>(() => {
    return Array.from({ length: TOTAL_EDGE_SEGMENTS }, (_, i) => ({
      z: i * EDGE_SEGMENT_LENGTH,
      index: i,
    }));
  }, []);

  // Only recompute visible segments when player moves significantly (every 20 units)
  const playerZBucket = Math.floor(player.position.z / 20) * 20;

  // Filter to only render edge segments near player
  const visibleEdgeSegments = useMemo(() => {
    const minZ = player.position.z - CHUNK_CONFIG.RENDER_BEHIND - EDGE_SEGMENT_LENGTH;
    const maxZ = player.position.z + CHUNK_CONFIG.RENDER_AHEAD + EDGE_SEGMENT_LENGTH;

    return allEdgeSegments.filter(
      (s) => s.z >= minZ && s.z <= maxZ
    );
  }, [allEdgeSegments, playerZBucket, player.position.z]);

  return (
    <>
      {visibleEdgeSegments.map((segment) => (
        <EdgeSegmentPair key={`edge-${segment.index}`} segment={segment} />
      ))}
    </>
  );
}

export default TrackEdges;
