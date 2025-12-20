import TextWithShadow from '@/components/TextWithShadow';
import ButtonSpinner from '@/components/ui/ButtonSpinner';
import { UpgradeType } from './upgrades';

interface UpgradeCardProps {
  upgrade: UpgradeType;
  level: number;
  cost: number;
  canAfford: boolean;
  isLoading: boolean;
  onUpgrade: () => void;
}

export default function UpgradeCard({
  upgrade,
  level,
  cost,
  canAfford,
  isLoading,
  onUpgrade
}: UpgradeCardProps) {
  return (
    <div
      className={`relative rounded-xl overflow-hidden active:scale-95 transition-transform ${
        canAfford && !isLoading ? 'cursor-pointer' : 'opacity-50'
      }`}
      onClick={() => canAfford && !isLoading && onUpgrade()}
      style={{
        backgroundColor: upgrade.bgColor,
        border: `3px solid ${upgrade.borderColor}`
      }}
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-full min-h-[120px]">
          <ButtonSpinner size="small" />
        </div>
      ) : (
        <>
          <div
            className="py-1 px-0.5 text-center"
            style={{ backgroundColor: upgrade.headerColor }}
          >
            <TextWithShadow className="text-white font-bold text-[8px] sm:text-[10px] uppercase leading-tight">
              {upgrade.name}
            </TextWithShadow>
          </div>

          <div className="flex flex-col items-center py-1 px-1">
            <img
              src={upgrade.icon}
              alt={upgrade.name}
              className="w-12 h-12 sm:w-12 sm:h-12 object-contain"
            />

            <div className="flex items-center justify-center gap-1 mt-1">
              <p className="text-gray-700 font-bold text-[12px] sm:text-xs">
                Level {level}
              </p>
              {canAfford && (
                <>
                  <span className="text-green-500 text-[10px]">→</span>
                  <TextWithShadow className="text-green-500 font-bold text-[12px] sm:text-xs">
                    {level + 1}
                  </TextWithShadow>
                </>
              )}
            </div>

            <div className="flex items-center gap-0.5 mt-1">
              <img src="/ui/Coin.Png" alt="Coin" className="w-4 h-4" />
              <TextWithShadow
                className={`font-bold text-[15px] sm:text-[15px] uppercase leading-tight ${
                  canAfford ? 'text-green-400' : 'text-red-500'
                }`}
              >
                {cost}
              </TextWithShadow>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
