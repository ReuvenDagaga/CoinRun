import FinishLine from './FinishLine';
import TrackEdges from './TrackEdges';
import DistanceMarkers from './DistanceMarkers';
import TrackSegments, { useTrackSegments } from './TrackSegments';


function Track() {
  const segments = useTrackSegments();

  return (
    <group>
      <TrackSegments segments={segments} />
      <TrackEdges />
      <DistanceMarkers />
      <FinishLine />
    </group>
  );
}

export default Track;

