import BasePopup from '@/components/ui/BasePopup';
import { powerLevels, PowerLevel } from './powerLevels';

interface PowerLevelInfoPopupProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: PowerLevel;
}

export default function PowerLevelInfoPopup({ isOpen, onClose, currentLevel }: PowerLevelInfoPopupProps) {
  return (
    <BasePopup isOpen={isOpen} onClose={onClose} title="Power Levels">
      <div className="p-3 space-y-1.5">
        {powerLevels.map((level) => {
          const isCurrent = level.level === currentLevel.level;
          const isLocked = level.level > currentLevel.level;

          return (
            <div
              key={level.level}
              className={`flex items-center gap-2 p-2 rounded-xl transition-all ${
                isCurrent
                  ? 'bg-yellow-500/20 border border-yellow-500/50'
                  : isLocked
                  ? 'opacity-40'
                  : 'bg-white/5'
              }`}
            >
              <img
                src={level.image}
                alt={level.name}
                className={`w-8 h-8 object-contain ${isLocked ? 'grayscale' : ''}`}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-semibold text-xs">{level.name}</span>
                  {isCurrent && (
                    <span className="text-[8px] bg-yellow-500 text-black px-1 py-0.5 rounded-full font-bold">
                      YOU
                    </span>
                  )}
                </div>
                <span className="text-white/50 text-[10px]">
                  {level.maxPoints === Infinity
                    ? `${level.minPoints.toLocaleString()}+`
                    : `${level.minPoints.toLocaleString()} - ${level.maxPoints.toLocaleString()}`}
                </span>
              </div>

              <span className="text-white/30 font-bold text-xs">#{level.level}</span>
            </div>
          );
        })}
      </div>
    </BasePopup>
  );
}
