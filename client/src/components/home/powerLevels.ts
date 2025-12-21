export interface PowerLevel {
  level: number;
  name: string;
  minPoints: number;
  maxPoints: number;
  image: string;
}

export const powerLevels: PowerLevel[] = [
  { level: 1, name: 'Rookie', minPoints: 0, maxPoints: 99, image: '/images/powerLevels/1.png' },
  { level: 2, name: 'Beginner', minPoints: 100, maxPoints: 249, image: '/images/powerLevels/2.png' },
  { level: 3, name: 'Amateur', minPoints: 250, maxPoints: 499, image: '/images/powerLevels/3.png' },
  { level: 4, name: 'Skilled', minPoints: 500, maxPoints: 999, image: '/images/powerLevels/4.png' },
  { level: 5, name: 'Experienced', minPoints: 1000, maxPoints: 1999, image: '/images/powerLevels/5.png' },
  { level: 6, name: 'Veteran', minPoints: 2000, maxPoints: 3499, image: '/images/powerLevels/6.png' },
  { level: 7, name: 'Expert', minPoints: 3500, maxPoints: 5499, image: '/images/powerLevels/7.png' },
  { level: 8, name: 'Elite', minPoints: 5500, maxPoints: 7999, image: '/images/powerLevels/8.png' },
  { level: 9, name: 'Master', minPoints: 8000, maxPoints: 11999, image: '/images/powerLevels/9.png' },
  { level: 10, name: 'Grandmaster', minPoints: 12000, maxPoints: 17999, image: '/images/powerLevels/10.png' },
  { level: 11, name: 'Champion', minPoints: 18000, maxPoints: 25999, image: '/images/powerLevels/11.png' },
  { level: 12, name: 'Hero', minPoints: 26000, maxPoints: 39999, image: '/images/powerLevels/12.png' },
  { level: 13, name: 'Legend', minPoints: 40000, maxPoints: 59999, image: '/images/powerLevels/13.png' },
  { level: 14, name: 'Mythic', minPoints: 60000, maxPoints: 99999, image: '/images/powerLevels/14.png' },
  { level: 15, name: 'Immortal', minPoints: 100000, maxPoints: Infinity, image: '/images/powerLevels/15.png' },
];

export const getCurrentPowerLevel = (points: number): PowerLevel => {
  return powerLevels.find(level => points >= level.minPoints && points <= level.maxPoints) || powerLevels[0];
};

export const getNextPowerLevel = (points: number): PowerLevel | null => {
  const current = getCurrentPowerLevel(points);
  if (current.level === 15) return null;
  return powerLevels[current.level]; // level is 1-indexed, so this gets the next
};

export const getProgressToNextLevel = (points: number): number => {
  const current = getCurrentPowerLevel(points);
  if (current.level === 15) return 100;

  const pointsInLevel = points - current.minPoints;
  const levelRange = current.maxPoints - current.minPoints + 1;
  return Math.floor((pointsInLevel / levelRange) * 100);
};
