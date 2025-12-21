import TextWithShadow from '@/components/TextWithShadow';
import { formatNumber } from './utils';
import { MEDAL_IMAGES, RANK_BORDERS, RANK_FALLBACK_BG, RANK_OVERLAYS } from './config';
import { LeaderboardEntry } from '@/services/api';


interface PodiumPlaceProps {
  entry: LeaderboardEntry;
  rank: 1 | 2 | 3;
}

function PodiumPlace({ entry, rank }: PodiumPlaceProps) {
  const isFirst = rank === 1;
  const hasAvatar = !!entry.avatar;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-3 ${RANK_BORDERS[rank]} ${
        isFirst ? 'w-[38%] h-36' : 'w-[31%] h-32'
      }`}
    >
      {/* Avatar as Background or Fallback */}
      {hasAvatar ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${entry.avatar})` }}
        />
      ) : (
        <div className={`absolute inset-0 ${RANK_FALLBACK_BG[rank]} flex items-center justify-center`}>
          <span className={`font-bold text-white/50 ${isFirst ? 'text-6xl' : 'text-5xl'}`}>
            {entry.username.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      {/* Color Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-b ${RANK_OVERLAYS[rank]}`} />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-between p-2">
        {/* Medal */}
        <img
          src={MEDAL_IMAGES[rank]}
          alt={`Rank ${rank}`}
          className={`${isFirst ? 'h-10' : 'h-8'} w-auto object-contain drop-shadow-lg`}
        />

        {/* Name & Power */}
        <div className="text-center">
          <TextWithShadow className={`font-bold text-white ${isFirst ? 'text-lg' : 'text-base'} truncate max-w-full`}>
            {entry.username}
          </TextWithShadow>
          <TextWithShadow className={`text-yellow-200 font-bold ${isFirst ? 'text-base' : 'text-sm'}`}>
            {formatNumber(entry.powerLevel)} PWR
          </TextWithShadow>
        </div>
      </div>
    </div>
  );
}

export default PodiumPlace;