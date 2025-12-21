import TextWithShadow from '@/components/TextWithShadow';
import { useEffect, useState } from 'react';

interface TimeRemaining {
  hours: number;
  minutes: number;
  seconds: number;
}

interface LeaderboardHeaderProps {
  initialTime: TimeRemaining;
}

export default function LeaderboardHeader({ initialTime }: LeaderboardHeaderProps) {
  const [timeUntilReset, setTimeUntilReset] = useState<TimeRemaining>(initialTime);

  // Update state when initialTime changes (after API fetch)
  useEffect(() => {
    setTimeUntilReset(initialTime);
  }, [initialTime]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeUntilReset(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-center mb-4 mt-10">
      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-600 to-cyan-600 px-3 py-1 rounded-full border-2 border-cyan-400 shadow-lg shadow-cyan-500/30">
        <TextWithShadow className="text-white text-lg">Resets in:</TextWithShadow>
        <TextWithShadow className="text-yellow-300 font-bold">
          {String(timeUntilReset.hours).padStart(2, '0')}:
          {String(timeUntilReset.minutes).padStart(2, '0')}:
          {String(timeUntilReset.seconds).padStart(2, '0')}
        </TextWithShadow>
      </div>
    </div>
  );
}
