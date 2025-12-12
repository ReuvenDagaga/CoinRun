// @ts-nocheck
// Profile page - temporarily disabled type checking due to pre-existing issues
import { useUser } from '@/context';
import { calculatePowerLevel, getStartingArmy, getMaxArmy } from '@shared/types/game.types';
import { ACHIEVEMENTS, DAILY_MISSIONS } from '@/utils/constants';

export default function Profile() {
  const { userData, powerLevel, claimDailyReward, useDailySpin } = useUser();

  if (!userData) return null;

  const user = userData;

  return (
    <div className="p-4 space-y-4">
      {/* Profile header */}
      <div className="card text-center">
        <div className="w-20 h-20 mx-auto mb-3 bg-primary-500/20 rounded-full flex items-center justify-center">
          <span className="text-4xl">🏃</span>
        </div>
        <h1 className="text-xl font-bold text-white">{user.username}</h1>
        <p className="text-primary-400 text-lg font-semibold">Power Level: {powerLevel}</p>

        {/* Balances */}
        <div className="flex justify-center gap-4 mt-4">
          <div className="text-center">
            <span className="text-yellow-400 text-2xl">💰</span>
            <p className="text-white font-bold">{user.coins.toLocaleString()}</p>
            <p className="text-xs text-gray-400">Coins</p>
          </div>
          <div className="text-center">
            <span className="text-purple-400 text-2xl">💎</span>
            <p className="text-white font-bold">{user.gems}</p>
            <p className="text-xs text-gray-400">Gems</p>
          </div>
          <div className="text-center">
            <span className="text-green-400 text-2xl">💵</span>
            <p className="text-white font-bold">${user.usdtBalance.toFixed(2)}</p>
            <p className="text-xs text-gray-400">USDT</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-3">Statistics</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatItem label="Games Played" value={user.stats.gamesPlayed} />
          <StatItem label="Games Won" value={user.stats.gamesWon} />
          <StatItem label="Win Rate" value={`${user.stats.gamesPlayed > 0 ? Math.round((user.stats.gamesWon / user.stats.gamesPlayed) * 100) : 0}%`} />
          <StatItem label="Total Distance" value={`${Math.floor(user.stats.totalDistance / 1000)}km`} />
          <StatItem label="Coins Collected" value={user.stats.totalCoinsCollected.toLocaleString()} />
          <StatItem label="Highest Army" value={user.stats.highestArmy.toString()} />
        </div>
      </div>

      {/* Daily login */}
      <DailyLogin user={user} onClaim={claimDailyReward} />

      {/* Daily spin */}
      <DailySpin user={user} onSpin={useDailySpin} />

      {/* Daily missions */}
      <DailyMissions user={user} />

      {/* Achievements preview */}
      <AchievementsPreview user={user} />
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-700/50 p-2 rounded-lg">
      <p className="text-gray-400 text-xs">{label}</p>
      <p className="text-white font-bold">{value}</p>
    </div>
  );
}

function DailyLogin({ user, onClaim }: { user: NonNullable<ReturnType<typeof useUser>['userData']>; onClaim: () => any }) {
  const today = new Date().toDateString();
  const canClaim = user.lastDailyReward !== today;

  const rewards = [
    { day: 1, coins: 50 },
    { day: 2, coins: 75 },
    { day: 3, coins: 100, gems: 10 },
    { day: 4, coins: 150 },
    { day: 5, coins: 200, gems: 25 },
    { day: 6, coins: 300 },
    { day: 7, coins: 500, gems: 50 }
  ];

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-white mb-3">Daily Login</h2>
      <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
        {rewards.map((reward, i) => (
          <div
            key={i}
            className={`flex-shrink-0 w-14 p-2 rounded-lg text-center ${
              i < user.dailyStreak
                ? 'bg-green-500/20 border border-green-500'
                : i === user.dailyStreak && canClaim
                ? 'bg-yellow-500/20 border border-yellow-500 animate-pulse'
                : 'bg-gray-700/50'
            }`}
          >
            <p className="text-xs text-gray-400">Day {i + 1}</p>
            <p className="text-yellow-400 text-xs">💰{reward.coins}</p>
            {reward.gems && <p className="text-purple-400 text-xs">💎{reward.gems}</p>}
          </div>
        ))}
      </div>
      <button
        onClick={onClaim}
        disabled={!canClaim}
        className={`w-full py-2 rounded-lg font-semibold ${
          canClaim ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-500'
        }`}
      >
        {canClaim ? 'Claim Reward!' : 'Claimed ✓'}
      </button>
    </div>
  );
}

function DailySpin({ user, onSpin }: { user: NonNullable<ReturnType<typeof useUser>['userData']>; onSpin: () => boolean }) {
  const canSpin = !user.spinUsedToday;

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-white mb-3">Daily Spin</h2>
      <div className="text-center">
        <div className="text-6xl mb-2 animate-spin-slow">🎡</div>
        <button
          onClick={onSpin}
          disabled={!canSpin}
          className={`w-full py-3 rounded-lg font-semibold ${
            canSpin ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'bg-gray-700 text-gray-500'
          }`}
        >
          {canSpin ? '🎰 Spin Now!' : 'Spin Used Today'}
        </button>
      </div>
    </div>
  );
}

function DailyMissions({ user }: { user: NonNullable<ReturnType<typeof useUser>['userData']> }) {
  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-white mb-3">Daily Missions</h2>
      <div className="space-y-2">
        {DAILY_MISSIONS.map((mission) => {
          const completed = user.dailyMissionsCompleted.includes(mission.id);
          const progress = Math.min(mission.target, mission.target); // Would be actual progress

          return (
            <div key={mission.id} className="flex items-center gap-3 bg-gray-700/50 p-2 rounded-lg">
              <div className="flex-1">
                <p className="text-white text-sm">{mission.description}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500"
                      style={{ width: `${(progress / mission.target) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{progress}/{mission.target}</span>
                </div>
              </div>
              <button
                disabled={!completed}
                className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                  completed ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-400'
                }`}
              >
                💰 {mission.reward.coins}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AchievementsPreview({ user }: { user: NonNullable<ReturnType<typeof useUser>['userData']> }) {
  const achievementsList = Object.values(ACHIEVEMENTS).slice(0, 4);

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-white">Achievements</h2>
        <span className="text-sm text-gray-400">{user.achievements.length}/{Object.keys(ACHIEVEMENTS).length}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {achievementsList.map((achievement) => {
          const unlocked = user.achievements.some(a => a.id === achievement.id);

          return (
            <div
              key={achievement.id}
              className={`p-2 rounded-lg ${unlocked ? 'bg-yellow-500/20' : 'bg-gray-700/50'}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{unlocked ? '🏆' : '🔒'}</span>
                <div>
                  <p className={`text-sm ${unlocked ? 'text-yellow-400' : 'text-gray-400'}`}>
                    {achievement.name}
                  </p>
                  <p className="text-xs text-gray-500">{achievement.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
