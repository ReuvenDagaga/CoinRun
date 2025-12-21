import TextWithShadow from '@/components/TextWithShadow';
import { LeaderboardRewardTier } from '@/services/api';
import { formatNumber } from './utils';
import { CLIENT_CONSTANTS } from '@/utils/constants';

interface DailyRewardsProps {
  rewards: LeaderboardRewardTier[];
}

export default function DailyRewards({ rewards }: DailyRewardsProps) {
  const firstPlace = rewards[0];
  const restPlaces = rewards.slice(1);

  return (
    <div className="mb-6 bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 rounded-2xl border-2 border-yellow-400/50 p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-3">
        <img src="/ui/leaderboard/leaderboard.png" alt="trophy" className="w-7 h-7" />
        <TextWithShadow className="text-xl font-bold text-yellow-300">
          Daily Rewards
        </TextWithShadow>
      </div>

      <div className="flex gap-2 items-stretch">
        {/* First Place - Large card on left */}
        {firstPlace && (
          <div className="w-[35%] bg-yellow-500/30 border-2 border-yellow-400 rounded-xl p-2 flex flex-col items-center justify-center">
            <TextWithShadow className="text-yellow-300 font-bold text-xl">
              #{firstPlace.rank}
            </TextWithShadow>
            <img
              src={CLIENT_CONSTANTS.CHEST_IMAGES[firstPlace.chest]}
              alt={firstPlace.chest}
              className="w-11 h-10 my-1"
            />
            <div className="flex flex-col items-center">
              <TextWithShadow className="flex items-center gap-1 text-yellow-300 text-md">
                {formatNumber(firstPlace.coins)}
                <img src="/ui/coin.png" alt="coins" className="w-4 h-4" />
              </TextWithShadow>
              {firstPlace.gems > 0 && (
                <TextWithShadow className="flex items-center gap-1 text-purple-300 text-md">
                  {formatNumber(firstPlace.gems)}
                  <img src="/ui/gem.png" alt="gems" className="w-4 h-4" />
                </TextWithShadow>
              )}
            </div>
          </div>
        )}

        {/* Rest Places - Stacked on right */}
        <div className="flex-1 flex flex-col gap-1 justify-between">
          {restPlaces.map((reward, idx) => (
            <div
              key={idx}
              className={`flex-1 flex items-center justify-between px-2 rounded-xl border ${
                idx === 0 ? 'bg-gray-400/30 border-gray-300' :
                idx === 1 ? 'bg-orange-500/30 border-orange-400' :
                'bg-cyan-500/20 border-cyan-400/50'
              }`}
            >
              <TextWithShadow className="text-white font-bold text-sm">#{reward.rank}</TextWithShadow>
              <div className="flex items-center gap-2 text-md">
                <TextWithShadow className="flex items-center gap-1 text-yellow-300">
                  {formatNumber(reward.coins)}
                  <img src="/ui/coin.png" alt="coins" className="w-4 h-4" />
                </TextWithShadow>
                {reward.gems > 0 && (
                  <TextWithShadow className="flex items-center gap-1 text-purple-300">
                    {formatNumber(reward.gems)}
                    <img src="/ui/gem.png" alt="gems" className="w-4 h-4" />
                  </TextWithShadow>
                )}
                <img
                  src={CLIENT_CONSTANTS.CHEST_IMAGES[reward.chest]}
                  alt={reward.chest}
                  className="w-5.5 h-5"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
