import { PowerLevel } from './powerLevels';

interface PowerLevelBadgeProps {
  level: PowerLevel;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
};

export default function PowerLevelBadge({ level, size = 'md' }: PowerLevelBadgeProps) {
  return (
    <img
      src={level.image}
      alt={level.name}
      className={`${sizeClasses[size]} object-contain`}
    />
  );
}
