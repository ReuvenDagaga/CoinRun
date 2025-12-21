import { PowerLevel } from './powerLevels';

interface PowerLevelProgressProps {
  current: PowerLevel;
  next: PowerLevel | null;
  points: number;
  progress: number;
}

export default function PowerLevelProgress({ current, next, points, progress }: PowerLevelProgressProps) {
  const pointsToNext = next ? next.minPoints - points : 0;

  return (
    <div className="flex-1">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-white ">{current.name}</span>
        {next && (
          <span className="text-white/60">{pointsToNext} to {next.name}</span>
        )}
      </div>

      <div className="h-2 bg-black/30 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs mt-1">
        <span className="text-yellow-400 font-bold">{points.toLocaleString()}</span>
        {next && (
          <span className="text-white/40">{next.minPoints.toLocaleString()}</span>
        )}
      </div>
    </div>
  );
}
