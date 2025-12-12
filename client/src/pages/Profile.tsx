import { useUser } from '@/context';
import { calculatePowerLevel, getStartingArmy, getMaxArmy } from '@shared/types/game.types';
import { ACHIEVEMENTS, DAILY_MISSIONS } from '@/utils/constants';

export default function Profile() {
  const { userData, powerLevel } = useUser();

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

        {/* Balances - VIRTUAL CURRENCIES ONLY */}
        <div className="flex justify-center gap-8 mt-4">
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
        </div>
      </div>

      {/* Stats */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-3">Statistics</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatItem label="Games Played" value={user.stats.gamesPlayed} />
          <StatItem label="Games Won" value={user.stats.gamesWon} />
          <StatItem label="Win Rate" value={`${user.stats.gamesPlayed > 0 ? Math.round((user.stats.gamesWon / user.stats.gamesPlayed) * 100) : 0}%`} />
          <StatItem label="Best Score" value={user.stats.bestScore.toLocaleString()} />
          <StatItem label="Total Distance" value={`${Math.floor(user.stats.totalDistance / 1000)}km`} />
          <StatItem label="Coins Collected" value={user.stats.totalCoinsCollected.toLocaleString()} />
          <StatItem label="Highest Army" value={user.stats.highestArmy.toString()} />
        </div>
      </div>

      {/* Daily Missions - Backend-backed missions */}
      <DailyMissions user={user} />

      {/* Weekly Missions */}
      <WeeklyMissions user={user} />

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

/**
 * REMOVED: DailyLogin and DailySpin components
 * These were client-side only features not backed by the server
 *
 * TODO: Implement server-backed daily rewards if needed via missions system
 */

function DailyMissions({ user }: { user: NonNullable<ReturnType<typeof useUser>['userData']> }) {
  const { claimMission } = useUser();

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-white mb-3">Daily Missions</h2>
      {user.dailyMissions.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-4">No daily missions available</p>
      ) : (
        <div className="space-y-2">
          {user.dailyMissions.map((mission) => {
            // Find mission definition from constants (if exists)
            const missionDef = DAILY_MISSIONS.find(m => m.id === mission.missionId);
            const target = missionDef?.target || 100;
            const progressPercent = (mission.progress / target) * 100;

            return (
              <div key={mission.missionId} className="flex items-center gap-3 bg-gray-700/50 p-2 rounded-lg">
                <div className="flex-1">
                  <p className="text-white text-sm">{missionDef?.description || mission.missionId}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500"
                        style={{ width: `${Math.min(progressPercent, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{mission.progress}/{target}</span>
                  </div>
                </div>
                <button
                  disabled={!mission.completed || mission.claimed}
                  onClick={() => missionDef && claimMission(mission.missionId, missionDef.reward)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    mission.completed && !mission.claimed
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-600 text-gray-400'
                  }`}
                >
                  {mission.claimed ? '✓' : missionDef ? `💰 ${missionDef.reward.coins}` : 'Claim'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function WeeklyMissions({ user }: { user: NonNullable<ReturnType<typeof useUser>['userData']> }) {
  const { claimMission } = useUser();

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-white mb-3">Weekly Missions</h2>
      {user.weeklyMissions.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-4">No weekly missions available</p>
      ) : (
        <div className="space-y-2">
          {user.weeklyMissions.map((mission) => {
            const target = 100; // Default target, should come from mission definition
            const progressPercent = (mission.progress / target) * 100;

            return (
              <div key={mission.missionId} className="flex items-center gap-3 bg-gray-700/50 p-2 rounded-lg">
                <div className="flex-1">
                  <p className="text-white text-sm">{mission.missionId}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500"
                        style={{ width: `${Math.min(progressPercent, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{mission.progress}/{target}</span>
                  </div>
                </div>
                <button
                  disabled={!mission.completed || mission.claimed}
                  onClick={() => claimMission(mission.missionId, { coins: 500 })}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    mission.completed && !mission.claimed
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-600 text-gray-400'
                  }`}
                >
                  {mission.claimed ? '✓' : 'Claim'}
                </button>
              </div>
            );
          })}
        </div>
      )}
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
          const userAchievement = user.achievements.find(a => a.achievementId === achievement.id);
          const unlocked = userAchievement?.unlocked || false;

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
                  {userAchievement && !unlocked && (
                    <p className="text-xs text-primary-400">{userAchievement.progress}%</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
