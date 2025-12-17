import { useMemo, memo } from "react";
import { useGame } from "@/context";
import { TRACK_LENGTH, TRACK_WIDTH } from "./config";
import { CHUNK_CONFIG } from "../utils/ChunkManager";

// Generate marker count based on track length (every 100m)
const MARKER_SPACING = 100;
const TOTAL_MARKERS = Math.floor(TRACK_LENGTH / MARKER_SPACING);

interface MarkerData {
  z: number;
  index: number;
}

// Single distance marker - memoized
const DistanceMarker = memo(function DistanceMarker({
  marker
}: {
  marker: MarkerData;
}) {
  return (
    <group position={[-(TRACK_WIDTH / 2 + 2), 0, marker.z]}>
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[0.8, 2, 0.2]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 2.2, 0]}>
        <boxGeometry args={[1.2, 0.4, 0.2]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
    </group>
  );
});

function DistanceMarkers() {
  const { player } = useGame();

  // Generate all marker positions once
  const allMarkers = useMemo<MarkerData[]>(() => {
    return Array.from({ length: TOTAL_MARKERS }, (_, i) => ({
      z: (i + 1) * MARKER_SPACING,
      index: i,
    }));
  }, []);

  // Only recompute visible markers when player moves significantly (every 20 units)
  const playerZBucket = Math.floor(player.position.z / 20) * 20;

  // Filter to only render markers near player
  const visibleMarkers = useMemo(() => {
    const minZ = player.position.z - CHUNK_CONFIG.RENDER_BEHIND;
    const maxZ = player.position.z + CHUNK_CONFIG.RENDER_AHEAD;

    return allMarkers.filter(
      (m) => m.z >= minZ && m.z <= maxZ
    );
  }, [allMarkers, playerZBucket, player.position.z]);

  return (
    <>
      {visibleMarkers.map((marker) => (
        <DistanceMarker key={`marker-${marker.index}`} marker={marker} />
      ))}
    </>
  );
}

export default DistanceMarkers;
