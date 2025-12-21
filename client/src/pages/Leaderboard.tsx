import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { runnerApi, LeaderboardEntry, LeaderboardRewardTier } from '@/services/api';
import PageReveal, { StaggerContainer, StaggerItem } from '@/components/ui/PageReveal';
import { CLIENT_CONSTANTS } from '@/utils/constants';
import LeaderboardHeader from '@/components/leaderboard/LeaderboardHeader';
import DailyRewards from '@/components/leaderboard/DailyRewards';
import TopThreePodium from '@/components/leaderboard/TopThreePodium';
import LeaderboardEntryCard from '@/components/leaderboard/LeaderboardEntryCard';
import CurrentUserCard from '@/components/leaderboard/CurrentUserCard';
import Loading from '@/components/ui/Loading';


export default function Leaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserEntry, setCurrentUserEntry] = useState<LeaderboardEntry | null>(null);
  const [rewards, setRewards] = useState<LeaderboardRewardTier[]>([]);
  const [timeUntilReset, setTimeUntilReset] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await runnerApi.getLeaderboard();
        setLeaderboard(response.data.leaderboard);
        setCurrentUserEntry(response.data.currentUser);
        setRewards(response.data.rewardInfo.rewards);
        setTimeUntilReset(response.data.rewardInfo.timeUntilReset);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);


  if (loading) return <Loading />;

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <PageReveal>
      <div
        className="min-h-screen pb-32 pt-4 px-4"
        style={{
          backgroundImage: `url(${CLIENT_CONSTANTS.LEADERBOARD_BACKGROUND_IMAGE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <StaggerContainer className="relative z-10">
          {/* Header with Timer */}
          <StaggerItem>
            <LeaderboardHeader initialTime={timeUntilReset} />
          </StaggerItem>

          {/* Daily Rewards Banner */}
          <StaggerItem>
            <DailyRewards rewards={rewards} />
          </StaggerItem>

          {/* Top 3 Podium */}
          <StaggerItem>
            <TopThreePodium top3={top3} />
          </StaggerItem>

          {/* Rest of leaderboard */}
          <StaggerItem>
            <div className="space-y-2">
              {rest.map((entry) => {
                const isCurrentUser = user && entry.oderId === user._id?.toString();
                return (
                  <LeaderboardEntryCard
                    key={entry.rank}
                    entry={entry}
                    isCurrentUser={!!isCurrentUser}
                  />
                );
              })}
            </div>
          </StaggerItem>

          {/* Current user if not in top 100 */}
          {currentUserEntry && !leaderboard.find(e => e.oderId === currentUserEntry.oderId) && (
            <StaggerItem>
              <CurrentUserCard currentUserEntry={currentUserEntry} />
            </StaggerItem>
          )}
        </StaggerContainer>
      </div>
    </PageReveal>
  );
}
