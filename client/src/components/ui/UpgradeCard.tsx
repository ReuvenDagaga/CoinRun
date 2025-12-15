import { useAuth } from '@/hooks/useAuth';
import { GAME_CONSTANTS, UserUpgrades } from '@shared/types/game.types';

interface UpgradeCardProps {
  type: keyof UserUpgrades;
}

const UPGRADE_INFO: Record<keyof UserUpgrades, {
  name: string;
  icon: string;
  description: string;
  effectText: (level: number) => string;
}> = {
  capacity: {
    name: 'Capacity',
    icon: '📦',
    description: 'Max army size',
    effectText: (level) => `Max: ${30 + level}`
  },
  addWarrior: {
    name: 'Add Warrior',
    icon: '➕',
    description: 'Starting soldiers',
    effectText: (level) => `Start: ${1 + level}`
  },
  warriorUpgrade: {
    name: 'Warrior Power',
    icon: '⚔️',
    description: 'Combat damage',
    effectText: (level) => `×${Math.pow(1.1, level).toFixed(2)}`
  },
  income: {
    name: 'Income',
    icon: '💰',
    description: 'Coin multiplier',
    effectText: (level) => `×${Math.pow(1.1, level).toFixed(2)}`
  },
  speed: {
    name: 'Speed',
    icon: '👟',
    description: 'Run faster',
    effectText: (level) => `×${Math.pow(1.03, level).toFixed(2)}`
  },
  jump: {
    name: 'Jump',
    icon: '🦘',
    description: 'Jump higher',
    effectText: (level) => `×${Math.pow(1.05, level).toFixed(2)}`
  },
  bulletPower: {
    name: 'Bullet Power',
    icon: '🔫',
    description: 'Ranged damage',
    effectText: (level) => `×${Math.pow(1.08, level).toFixed(2)}`
  },
  magnetRadius: {
    name: 'Magnet',
    icon: '🧲',
    description: 'Coin attraction',
    effectText: (level) => `${(2 * Math.pow(1.04, level)).toFixed(1)}m`
  }
};

export default function UpgradeCard({ type }: UpgradeCardProps) {
  const { user, purchaseUpgrade, canAffordUpgrade, getUpgradeCost } = useAuth();

  if (!user) return null;

  const info = UPGRADE_INFO[type];
  const currentLevel = user.upgrades[type];
  const maxLevel = GAME_CONSTANTS.MAX_LEVELS[type];
  const isMaxed = currentLevel >= maxLevel;
  const cost = getUpgradeCost(type);
  const canAfford = canAffordUpgrade(type);

  const handleUpgrade = () => {
    if (canAfford && !isMaxed) {
      purchaseUpgrade(type);
    }
  };

  return (
    <div
      onClick={handleUpgrade}
      className={`card card-hover p-3 ${!canAfford && !isMaxed ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">{info.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold text-sm truncate">{info.name}</h3>
            <span className="text-xs text-gray-400">
              Lv{currentLevel}/{maxLevel}
            </span>
          </div>
          <p className="text-xs text-gray-400 truncate">{info.description}</p>
          <p className="text-xs text-primary-400 mt-1">{info.effectText(currentLevel)}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-500 transition-all"
          style={{ width: `${(currentLevel / maxLevel) * 100}%` }}
        />
      </div>

      {/* Cost/Max button */}
      <div className="mt-2">
        {isMaxed ? (
          <div className="text-center text-xs text-green-400 font-semibold py-1">
            MAXED ✓
          </div>
        ) : (
          <button
            disabled={!canAfford}
            className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-all ${
              canAfford
                ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                : 'bg-gray-700 text-gray-500'
            }`}
          >
            💰 {cost.toLocaleString()}
          </button>
        )}
      </div>
    </div>
  );
}

// Compact version for in-game quick upgrade
export function UpgradeCardCompact({ type }: UpgradeCardProps) {
  const { user, purchaseUpgrade, canAffordUpgrade, getUpgradeCost } = useAuth();

  if (!user) return null;

  const info = UPGRADE_INFO[type];
  const currentLevel = user.upgrades[type];
  const maxLevel = GAME_CONSTANTS.MAX_LEVELS[type];
  const isMaxed = currentLevel >= maxLevel;
  const cost = getUpgradeCost(type);
  const canAfford = canAffordUpgrade(type);

  return (
    <button
      onClick={() => canAfford && !isMaxed && purchaseUpgrade(type)}
      disabled={!canAfford || isMaxed}
      className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
        canAfford && !isMaxed
          ? 'bg-gray-700 hover:bg-gray-600'
          : 'bg-gray-800 opacity-50'
      }`}
    >
      <span className="text-lg">{info.icon}</span>
      <div className="text-left">
        <div className="text-xs text-white">Lv{currentLevel}</div>
        <div className="text-xs text-yellow-400">
          {isMaxed ? 'MAX' : `💰${cost}`}
        </div>
      </div>
    </button>
  );
}
