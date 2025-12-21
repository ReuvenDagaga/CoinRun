import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getCurrentPowerLevel, getNextPowerLevel, getProgressToNextLevel } from './powerLevels';
import PowerLevelBadge from './PowerLevelBadge';
import PowerLevelProgress from './PowerLevelProgress';
import PowerLevelInfoPopup from './PowerLevelInfoPopup';

export default function PowerLevelDisplay() {
  const { powerLevel } = useAuth();
  const [showInfo, setShowInfo] = useState(false);

  const currentLevel = getCurrentPowerLevel(powerLevel);
  const nextLevel = getNextPowerLevel(powerLevel);
  const progress = getProgressToNextLevel(powerLevel);

  return (
    <>
      <div className="pt-2 px-4 relative z-50 pointer-events-auto">
        <button
          onClick={() => setShowInfo(true)}
          className="w-full flex items-center gap-3 bg-black/20 rounded-xl p-2 backdrop-blur-sm active:scale-[0.98] transition-transform"
        >
          <PowerLevelBadge level={currentLevel} size="md" />

          <PowerLevelProgress
            current={currentLevel}
            next={nextLevel}
            points={powerLevel}
            progress={progress}
          />

          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">
            ?
          </div>
        </button>
      </div>

      <PowerLevelInfoPopup
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        currentLevel={currentLevel}
      />
    </>
  );
}
