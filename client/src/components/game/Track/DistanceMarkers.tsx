import { MARKER_COUNT, TRACK_WIDTH } from "./config";

function DistanceMarkers() {

  return (
    <>
      {Array.from({ length: MARKER_COUNT }, (_, i) => (
        <group key={`marker-${i}`} position={[-(TRACK_WIDTH / 2 + 2), 0, (i + 1) * 100]}>
          <mesh position={[0, 1, 0]}>
            <boxGeometry args={[0.8, 2, 0.2]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, 2.2, 0]}>
            <boxGeometry args={[1.2, 0.4, 0.2]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
        </group>
      ))}
    </>
  );
}

export default DistanceMarkers;