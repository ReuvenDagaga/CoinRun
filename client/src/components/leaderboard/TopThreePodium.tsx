import { LeaderboardEntry } from '@/services/api';
import PodiumPlace from './PodiumPlace';


interface TopThreePodiumProps {
  top3: LeaderboardEntry[];
}

export default function TopThreePodium({ top3 }: TopThreePodiumProps) {
  if (top3.length === 0) return null;

  return (
    <div className="flex justify-center items-end gap-2 mb-6">
      {top3[1] && <PodiumPlace entry={top3[1]} rank={2} />}
      {top3[0] && <PodiumPlace entry={top3[0]} rank={1} />}
      {top3[2] && <PodiumPlace entry={top3[2]} rank={3} />}
    </div>
  );
}
