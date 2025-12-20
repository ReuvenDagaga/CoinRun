import { useAuth } from '@/hooks/useAuth';
import TextWithShadow from '@/components/TextWithShadow';

export default function PowerLevelDisplay() {
  const { powerLevel } = useAuth();

  return (
    <div className="pt-2 px-4 text-center">
      <TextWithShadow className="text-xs sm:text-sm text-white/80 font-semibold">
        Power Level
      </TextWithShadow>
      <TextWithShadow className="text-2xl sm:text-3xl font-bold text-yellow-400">
        {powerLevel}
      </TextWithShadow>
    </div>
  );
}
