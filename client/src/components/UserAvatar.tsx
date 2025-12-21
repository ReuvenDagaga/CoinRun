import { useState } from 'react';

interface UserAvatarProps {
  avatar?: string | null;
  username: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  rank?: number;
  className?: string;
  showBadge?: boolean;
  badgeImage?: string;
}

const sizeClasses = {
  sm: 'w-10 h-10 text-base',
  md: 'w-14 h-14 text-xl',
  lg: 'w-16 h-16 text-2xl',
  xl: 'w-20 h-20 text-3xl',
};

const borderColors = {
  1: 'border-yellow-300 shadow-yellow-500/50',
  2: 'border-gray-300',
  3: 'border-orange-400',
  default: 'border-white/30',
};

const gradientColors = {
  1: 'from-yellow-400 to-amber-600',
  2: 'from-gray-400 to-gray-600',
  3: 'from-orange-400 to-amber-600',
  default: 'from-cyan-500 to-blue-600',
};

export default function UserAvatar({
  avatar,
  username,
  size = 'md',
  rank,
  className = '',
  showBadge = false,
  badgeImage,
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const sizeClass = sizeClasses[size];
  const borderColor = rank && rank <= 3 ? borderColors[rank as 1 | 2 | 3] : borderColors.default;
  const gradient = rank && rank <= 3 ? gradientColors[rank as 1 | 2 | 3] : gradientColors.default;
  const borderWidth = rank && rank <= 3 ? 'border-4' : 'border-2';

  const showImage = avatar && !imageError;

  return (
    <div className={`relative ${className}`}>
      {showImage ? (
        <img
          src={avatar}
          alt={username}
          onError={() => setImageError(true)}
          className={`${sizeClass} rounded-full ${borderWidth} ${borderColor} shadow-lg object-cover`}
        />
      ) : (
        <div
          className={`${sizeClass} rounded-full bg-gradient-to-br ${gradient} ${borderWidth} ${borderColor} flex items-center justify-center shadow-lg`}
        >
          <span className="font-bold text-white drop-shadow-md">
            {username[0]?.toUpperCase() || '?'}
          </span>
        </div>
      )}

      {showBadge && badgeImage && (
        <img
          src={badgeImage}
          alt={`Rank ${rank}`}
          className={`absolute -bottom-2 -right-2 ${size === 'xl' ? 'w-10 h-10' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6'}`}
        />
      )}
    </div>
  );
}
