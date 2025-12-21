import { LeaderboardEntry } from '@/services/api';
import UserAvatar from '../UserAvatar';
import TextWithShadow from '@/components/TextWithShadow';
import { formatNumber } from './utils';

interface LeaderboardEntryCardProps {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}

export default function LeaderboardEntryCard({
  entry,
  isCurrentUser,
}: LeaderboardEntryCardProps) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border-2 backdrop-blur-sm ${
        isCurrentUser
          ? 'bg-gradient-to-r from-green-600/40 to-emerald-600/40 border-green-400'
          : 'bg-gradient-to-r from-sky-800/60 to-cyan-800/60 border-cyan-600/50'
      }`}
    >
      {/* Rank */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
          entry.rank <= 10
            ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg shadow-cyan-500/30'
            : 'bg-gray-700 text-gray-300'
        }`}
      >
        <TextWithShadow>{entry.rank}</TextWithShadow>
      </div>

      {/* Avatar */}
      <UserAvatar
        avatar={entry.avatar}
        username={entry.username}
        size="sm"
      />

      {/* Name */}
      <div className="flex-1 min-w-0">
        <TextWithShadow className={`font-bold truncate ${isCurrentUser ? 'text-green-300' : 'text-white'}`}>
          {entry.username}
          {isCurrentUser && <span className="ml-2 text-xs text-green-400">(You)</span>}
        </TextWithShadow>
      </div>

      {/* Power Level */}
      <div className="text-right">
        <TextWithShadow className="text-yellow-300 font-bold text-lg">{formatNumber(entry.powerLevel)}</TextWithShadow>
        <TextWithShadow className="text-xs text-cyan-200">PWR</TextWithShadow>
      </div>
    </div>
  );
}
