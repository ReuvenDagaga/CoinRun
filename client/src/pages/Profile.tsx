// pages/Profile.tsx
import { useAuth } from '@/hooks/useAuth';
import TextWithShadow from '@/components/TextWithShadow';

export default function Profile() {
  const { user, powerLevel } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-full pb-32">
      <ProfileHeader user={user} powerLevel={powerLevel} />
      <StatsSection user={user} />
      <DailyRewardsSection user={user} />
      <AchievementsSection user={user} />
    </div>
  );
}

function ProfileHeader({ user, powerLevel }: { user: any; powerLevel: number }) {
  return (
    <section className="relative px-4 py-6">
      <div className="relative bg-gradient-to-b from-purple-600/30 to-transparent rounded-3xl p-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img 
              src="/ui/profile/avatar-frame.png" 
              alt="Frame" 
              className="w-24 h-24"
            />
            <img 
              src={user.avatar || '/ui/profile/default-avatar.png'} 
              alt="Avatar" 
              className="absolute inset-2 w-20 h-20 rounded-full object-cover"
            />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 px-3 py-0.5 rounded-full">
              <TextWithShadow as="span" className="text-white text-xs font-bold">
                Lvl {Math.floor(powerLevel / 100) + 1}
              </TextWithShadow>
            </div>
          </div>
          
          <div className="flex-1">
            <TextWithShadow className="text-white text-xl font-bold">
              {user.username}
            </TextWithShadow>
            <div className="flex items-center gap-1 mt-1">
              <img src="/ui/icons/power.png" alt="Power" className="w-5 h-5" />
              <TextWithShadow as="span" className="text-yellow-400 font-bold">
                {powerLevel}
              </TextWithShadow>
              <span className="text-white/60 text-sm">Power</span>
            </div>
            <div className="flex gap-3 mt-2">
              <div className="flex items-center gap-1 bg-black/30 rounded-full px-2 py-1">
                <img src="/ui/Coin.Png" alt="Coins" className="w-4 h-4" />
                <TextWithShadow as="span" className="text-yellow-400 text-sm font-bold">
                  {user.coins.toLocaleString()}
                </TextWithShadow>
              </div>
              <div className="flex items-center gap-1 bg-black/30 rounded-full px-2 py-1">
                <img src="/ui/Gem.Png" alt="Gems" className="w-4 h-4" />
                <TextWithShadow as="span" className="text-purple-400 text-sm font-bold">
                  {user.gems}
                </TextWithShadow>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsSection({ user }: { user: any }) {
  const stats = [
    { icon: '/ui/stats/games.png', label: 'Games', value: user.gamesPlayed },
    { icon: '/ui/stats/wins.png', label: 'Wins', value: user.gamesWon },
    { icon: '/ui/stats/winrate.png', label: 'Win %', value: `${user.gamesPlayed > 0 ? Math.round((user.gamesWon / user.gamesPlayed) * 100) : 0}%` },
    { icon: '/ui/stats/distance.png', label: 'Distance', value: `${Math.floor(user.totalDistance / 1000)}km` },
    { icon: '/ui/stats/coins.png', label: 'Collected', value: user.totalCoinsCollected.toLocaleString() },
    { icon: '/ui/stats/army.png', label: 'Best Army', value: user.highestArmy },
  ];

  return (
    <section className="px-4 py-4">
      <div className="relative rounded-2xl overflow-hidden">
        <img 
          src="/ui/panels/stats-bg.png" 
          alt="Stats BG" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative p-4">
          <TextWithShadow as="h2" className="text-white text-lg font-bold text-center mb-3">
            Statistics
          </TextWithShadow>
          <div className="grid grid-cols-3 gap-2">
            {stats.map((stat, i) => (
              <div key={i} className="bg-black/30 rounded-xl p-2 text-center">
                <img src={stat.icon} alt={stat.label} className="w-8 h-8 mx-auto mb-1" />
                <TextWithShadow className="text-white font-bold text-sm">
                  {stat.value}
                </TextWithShadow>
                <p className="text-white/60 text-[10px]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function DailyRewardsSection({ user }: { user: any }) {
  const today = new Date().toDateString();
  const lastReset = user.lastDailyReset ? new Date(user.lastDailyReset).toDateString() : null;
  const canClaim = lastReset !== today;

  const rewards = [
    { day: 1, coins: 50, claimed: false },
    { day: 2, coins: 75, claimed: false },
    { day: 3, coins: 100, gems: 10, claimed: false },
    { day: 4, coins: 150, claimed: false },
    { day: 5, coins: 200, gems: 25, claimed: false },
    { day: 6, coins: 300, claimed: false },
    { day: 7, coins: 500, gems: 50, special: true, claimed: false },
  ];

  return (
    <section className="px-4 py-4">
      <div className="relative rounded-2xl overflow-hidden">
        <img 
          src="/ui/panels/daily-bg.png" 
          alt="Daily BG" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative p-4">
          <TextWithShadow as="h2" className="text-white text-lg font-bold text-center mb-3">
            Daily Rewards
          </TextWithShadow>
          <div className="flex gap-1.5 overflow-x-auto pb-2">
            {rewards.map((reward, i) => (
              <div
                key={i}
                className={`relative flex-shrink-0 w-12 rounded-xl overflow-hidden ${
                  reward.claimed ? 'opacity-50' : ''
                }`}
              >
                <img 
                  src={reward.special ? '/ui/daily/day-special.png' : '/ui/daily/day-normal.png'} 
                  alt={`Day ${reward.day}`}
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
                  <TextWithShadow as="span" className="text-white text-[8px] font-bold">
                    Day {reward.day}
                  </TextWithShadow>
                  <img src="/ui/Coin.Png" alt="Coins" className="w-4 h-4 my-0.5" />
                  <TextWithShadow as="span" className="text-yellow-400 text-[8px] font-bold">
                    {reward.coins}
                  </TextWithShadow>
                  {reward.gems && (
                    <TextWithShadow as="span" className="text-purple-400 text-[8px] font-bold">
                      +{reward.gems}💎
                    </TextWithShadow>
                  )}
                </div>
                {reward.claimed && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <img src="/ui/icons/checkmark.png" alt="Claimed" className="w-6 h-6" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <button
            disabled={!canClaim}
            className={`relative w-full mt-3 rounded-xl overflow-hidden active:scale-95 transition-transform ${
              !canClaim ? 'opacity-50' : ''
            }`}
          >
            <img 
              src={canClaim ? '/ui/buttons/claim-btn.png' : '/ui/buttons/claimed-btn.png'} 
              alt="Claim" 
              className="w-full h-auto"
            />
            <TextWithShadow as="span" className="absolute inset-0 flex items-center justify-center text-white font-bold">
              {canClaim ? 'Claim Reward!' : 'Claimed ✓'}
            </TextWithShadow>
          </button>
        </div>
      </div>
    </section>
  );
}

function AchievementsSection({ user }: { user: any }) {
  const achievements = [
    { id: 'first_win', name: 'First Victory', icon: '/ui/achievements/first-win.png', unlocked: user.gamesWon >= 1 },
    { id: 'collector', name: 'Coin Collector', icon: '/ui/achievements/collector.png', unlocked: user.totalCoinsCollected >= 10000 },
    { id: 'runner', name: 'Marathon Runner', icon: '/ui/achievements/runner.png', unlocked: user.totalDistance >= 100000 },
    { id: 'champion', name: 'Champion', icon: '/ui/achievements/champion.png', unlocked: user.gamesWon >= 100 },
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <section className="px-4 py-4">
      <div className="relative rounded-2xl overflow-hidden">
        <img 
          src="/ui/panels/achievements-bg.png" 
          alt="Achievements BG" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative p-4">
          <div className="flex justify-between items-center mb-3">
            <TextWithShadow as="h2" className="text-white text-lg font-bold">
              Achievements
            </TextWithShadow>
            <TextWithShadow as="span" className="text-yellow-400 text-sm font-bold">
              {unlockedCount}/{achievements.length}
            </TextWithShadow>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`relative rounded-xl overflow-hidden ${
                  !achievement.unlocked ? 'opacity-40 grayscale' : ''
                }`}
              >
                <img 
                  src="/ui/achievements/achievement-frame.png" 
                  alt="Frame" 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
                  <img 
                    src={achievement.icon} 
                    alt={achievement.name} 
                    className="w-8 h-8"
                  />
                </div>
                {!achievement.unlocked && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img src="/ui/icons/lock.png" alt="Locked" className="w-6 h-6" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}