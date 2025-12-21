import { LeaderboardEntry } from '@/services/api';
import UserAvatar from './UserAvatar';

interface CurrentUserCardProps {
  currentUserEntry: LeaderboardEntry;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

export default function CurrentUserCard({ currentUserEntry }: CurrentUserCardProps) {
  return (
    <div className="mt-4">
      <div className="text-center text-gray-400 text-sm mb-2">• • •</div>

      <div className="flex items-center gap-3 p-3 rounded-xl border-2 bg-gradient-to-r from-green-600/40 to-emerald-600/40 border-green-400 backdrop-blur-sm">
        <div className="w-10 h-10 rounded-xl bg-gray-700 flex items-center justify-center font-bold text-lg text-gray-300">
          {currentUserEntry.rank}
        </div>

        <UserAvatar
          avatar={currentUserEntry.avatar}
          username={currentUserEntry.username}
          size="sm"
        />

        <div className="flex-1 min-w-0">
          <p className="font-bold text-green-300 truncate">
            {currentUserEntry.username}
            <span className="ml-2 text-xs text-green-400">(You)</span>
          </p>
        </div>

        <div className="text-right">
          <p className="text-yellow-300 font-bold">{formatNumber(currentUserEntry.powerLevel)}</p>
          <p className="text-xs text-cyan-300">PWR</p>
        </div>
      </div>
    </div>
  );
}
