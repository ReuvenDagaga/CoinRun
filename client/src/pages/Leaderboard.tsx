import { useState } from 'react';
import { useUser } from '@/context';

type LeaderboardType = 'daily' | 'weekly' | 'alltime' | 'friends';

interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  isCurrentUser?: boolean;
}

// Mock data - in real app this would come from API
const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, username: 'ProRunner', score: 125000 },
  { rank: 2, username: 'SpeedDemon', score: 118500 },
  { rank: 3, username: 'CoinKing', score: 112000 },
  { rank: 4, username: 'ArmyMaster', score: 105500 },
  { rank: 5, username: 'GateHunter', score: 98200 },
  { rank: 6, username: 'QuickFeet', score: 92100 },
  { rank: 7, username: 'RunnerX', score: 87500 },
  { rank: 8, username: 'Champion99', score: 83200 },
  { rank: 9, username: 'GamePro', score: 79800 },
  { rank: 10, username: 'FastLane', score: 75400 }
];

export default function Leaderboard() {
  const [activeType, setActiveType] = useState<LeaderboardType>('daily');
  const { userData } = useUser();
  const user = userData;

  const types: { key: LeaderboardType; label: string }[] = [
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'alltime', label: 'All Time' },
    { key: 'friends', label: 'Friends' }
  ];

  // Add current user to leaderboard
  const leaderboard = user
    ? [...mockLeaderboard, {
        rank: 42,
        username: user.username,
        score: user.stats.totalCoinsCollected,
        isCurrentUser: true
      }].sort((a, b) => b.score - a.score).map((entry, i) => ({ ...entry, rank: i + 1 }))
    : mockLeaderboard;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-white mb-4">Leaderboard</h1>

      {/* Type selector */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {types.map((type) => (
          <button
            key={type.key}
            onClick={() => setActiveType(type.key)}
            className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-all ${
              activeType === type.key
                ? 'bg-primary-500 text-white'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Top 3 podium */}
      <div className="flex justify-center items-end gap-2 mb-6">
        {/* 2nd place */}
        <div className="w-24">
          <div className="bg-gray-700 rounded-t-xl p-2 text-center h-24 flex flex-col justify-end">
            <div className="text-3xl mb-1">🥈</div>
            <p className="text-white text-sm font-semibold truncate">{leaderboard[1]?.username}</p>
            <p className="text-gray-400 text-xs">{leaderboard[1]?.score.toLocaleString()}</p>
          </div>
        </div>

        {/* 1st place */}
        <div className="w-28">
          <div className="bg-yellow-500/20 border-2 border-yellow-500 rounded-t-xl p-2 text-center h-32 flex flex-col justify-end">
            <div className="text-4xl mb-1">👑</div>
            <p className="text-yellow-400 font-bold truncate">{leaderboard[0]?.username}</p>
            <p className="text-yellow-300 text-sm">{leaderboard[0]?.score.toLocaleString()}</p>
          </div>
        </div>

        {/* 3rd place */}
        <div className="w-24">
          <div className="bg-gray-700 rounded-t-xl p-2 text-center h-20 flex flex-col justify-end">
            <div className="text-2xl mb-1">🥉</div>
            <p className="text-white text-sm font-semibold truncate">{leaderboard[2]?.username}</p>
            <p className="text-gray-400 text-xs">{leaderboard[2]?.score.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Rest of leaderboard */}
      <div className="space-y-2">
        {leaderboard.slice(3).map((entry) => (
          <div
            key={entry.rank}
            className={`card flex items-center gap-3 ${
              entry.isCurrentUser ? 'border-2 border-primary-500' : ''
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
              entry.rank <= 10 ? 'bg-primary-500/20 text-primary-400' : 'bg-gray-700 text-gray-400'
            }`}>
              {entry.rank}
            </div>
            <div className="flex-1">
              <p className={`font-semibold ${entry.isCurrentUser ? 'text-primary-400' : 'text-white'}`}>
                {entry.username}
                {entry.isCurrentUser && <span className="ml-2 text-xs">(You)</span>}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white font-bold">{entry.score.toLocaleString()}</p>
              <p className="text-xs text-gray-400">points</p>
            </div>
          </div>
        ))}
      </div>

      {/* Daily rewards info */}
      <div className="mt-6 card bg-gradient-to-r from-yellow-500/20 to-orange-500/20">
        <h3 className="text-white font-semibold mb-2">Daily Rewards</h3>
        <div className="space-y-1 text-sm">
          <p className="flex justify-between">
            <span className="text-yellow-400">🥇 #1</span>
            <span className="text-white">5,000 💰 + 200 💎</span>
          </p>
          <p className="flex justify-between">
            <span className="text-gray-300">🥈 #2</span>
            <span className="text-white">3,000 💰 + 150 💎</span>
          </p>
          <p className="flex justify-between">
            <span className="text-orange-400">🥉 #3</span>
            <span className="text-white">2,000 💰 + 100 💎</span>
          </p>
          <p className="flex justify-between">
            <span className="text-gray-400">#4-10</span>
            <span className="text-white">1,000 💰 + 50 💎</span>
          </p>
        </div>
      </div>
    </div>
  );
}
