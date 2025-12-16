import { COLORS, TRACK_LENGTH, TRACK_WIDTH } from "./config";

function TrackEdges() {

  return (
    <>
      <mesh position={[-TRACK_WIDTH / 2 + 0.15, 0.01, TRACK_LENGTH / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.3, TRACK_LENGTH]} />
        <meshBasicMaterial color={COLORS.trackEdge} transparent opacity={0.6} />
      </mesh>
      <mesh position={[TRACK_WIDTH / 2 - 0.15, 0.01, TRACK_LENGTH / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.3, TRACK_LENGTH]} />
        <meshBasicMaterial color={COLORS.trackEdge} transparent opacity={0.6} />
      </mesh>
    </>
  );
}

export default TrackEdges;