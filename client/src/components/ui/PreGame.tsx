// components/ui/PreGame.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getStartingArmy, getMaxArmy } from '@shared/types/game.types';

const textShadow = '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000';

interface UpgradeType {
  key: string;
  name: string;
  icon: string;
}

const upgrades: UpgradeType[] = [
  { key: 'capacity', name: 'Capacity', icon: '/ui/upgrades/capacity.png' },
  { key: 'addWarrior', name: 'Warriors', icon: '/ui/upgrades/warrior.png' },
  { key: 'warriorUpgrade', name: 'Power', icon: '/ui/upgrades/power.png' },
  { key: 'income', name: 'Income', icon: '/ui/upgrades/income.png' },
  { key: 'speed', name: 'Speed', icon: '/ui/upgrades/speed.png' },
  { key: 'jump', name: 'Jump', icon: '/ui/upgrades/jump.png' },
  { key: 'bulletPower', name: 'Bullet', icon: '/ui/upgrades/bullet.png' },
  { key: 'magnetRadius', name: 'Magnet', icon: '/ui/upgrades/magnet.png' },
];

export default function PreGame() {
  const navigate = useNavigate();
  const { user, powerLevel, purchaseUpgrade, getUpgradeCost, canAffordUpgrade } = useAuth();
  const [selectedMode, setSelectedMode] = useState<'solo' | '1v1'>('solo');

  if (!user) return null;

  const startingArmy = getStartingArmy(user.upgrades.addWarrior);
  const maxArmy = getMaxArmy(user.upgrades.capacity);

  const handleStart = () => {
    navigate(`/game/${selectedMode}`);
  };

  const handleUpgrade = async (type: string) => {
    await purchaseUpgrade(type as any);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 pt-4 pb-2 px-4">
        <div className="text-center mb-4">
          <p 
            className="text-lg text-white/80 font-semibold"
            style={{ textShadow }}
          >
            Power Level
          </p>
          <p 
            className="text-4xl font-bold text-yellow-400"
            style={{ textShadow }}
          >
            {powerLevel}
          </p>
        </div>

        <div className="relative w-40 h-40 mx-auto mb-4">
          <img 
            src="/ui/character-frame.png" 
            alt="Frame" 
            className="absolute inset-0 w-full h-full object-contain"
          />
          <img 
            src={`/ui/skins/${user.currentSkin}.png`} 
            alt="Character" 
            className="absolute inset-4 w-32 h-32 object-contain"
          />
        </div>

        <div className="flex justify-center gap-6 mb-2">
          <div className="flex items-center gap-2 bg-black/30 rounded-full px-4 py-2">
            <img src="/ui/icons/army.png" alt="Start" className="w-6 h-6" />
            <span 
              className="text-white font-bold text-lg"
              style={{ textShadow }}
            >
              {startingArmy}
            </span>
            <span className="text-white/60 text-sm">START</span>
          </div>
          <div className="flex items-center gap-2 bg-black/30 rounded-full px-4 py-2">
            <img src="/ui/icons/max.png" alt="Max" className="w-6 h-6" />
            <span 
              className="text-white font-bold text-lg"
              style={{ textShadow }}
            >
              {maxArmy}
            </span>
            <span className="text-white/60 text-sm">MAX</span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-2">
        <h2 
          className="text-xl font-bold text-white text-center mb-3"
          style={{ textShadow }}
        >
          Upgrades
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {upgrades.map((upgrade) => {
            const level = user.upgrades[upgrade.key as keyof typeof user.upgrades] || 0;
            const cost = getUpgradeCost(upgrade.key as any);
            const canAfford = canAffordUpgrade(upgrade.key as any);

            return (
              <div 
                key={upgrade.key}
                className="relative rounded-xl overflow-hidden"
                onClick={() => canAfford && handleUpgrade(upgrade.key)}
              >
                <img 
                  src="/ui/upgrade-card-bg.png" 
                  alt="Card BG" 
                  className="w-full h-24 object-cover"
                />
                <div className="absolute inset-0 flex items-center p-3">
                  <img 
                    src={upgrade.icon} 
                    alt={upgrade.name} 
                    className="w-12 h-12 object-contain"
                  />
                  <div className="flex-1 ml-3">
                    <p 
                      className="text-white font-bold text-sm"
                      style={{ textShadow }}
                    >
                      {upgrade.name}
                    </p>
                    <p 
                      className="text-yellow-400 font-bold text-xs"
                      style={{ textShadow }}
                    >
                      Lvl {level}
                    </p>
                  </div>
                  <div 
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                      canAfford ? 'bg-green-500/80' : 'bg-gray-500/80'
                    }`}
                  >
                    <img src="/ui/Coin.Png" alt="Coin" className="w-4 h-4" />
                    <span 
                      className="text-white font-bold text-xs"
                      style={{ textShadow }}
                    >
                      {cost}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-shrink-0 px-4 pb-4 pt-2 space-y-3">
        <div className="flex gap-3">
          <button
            onClick={() => setSelectedMode('solo')}
            className={`relative flex-1 h-14 rounded-xl overflow-hidden transition-transform ${
              selectedMode === 'solo' ? 'scale-105 ring-2 ring-yellow-400' : 'opacity-70'
            }`}
          >
            <img 
              src="/ui/buttons/solo-btn.png" 
              alt="Solo" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <span 
              className="relative z-10 text-white font-bold text-lg"
              style={{ textShadow }}
            >
              Solo
            </span>
          </button>
          <button
            onClick={() => setSelectedMode('1v1')}
            className={`relative flex-1 h-14 rounded-xl overflow-hidden transition-transform ${
              selectedMode === '1v1' ? 'scale-105 ring-2 ring-yellow-400' : 'opacity-70'
            }`}
          >
            <img 
              src="/ui/buttons/pvp-btn.png" 
              alt="1v1" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <span 
              className="relative z-10 text-white font-bold text-lg"
              style={{ textShadow }}
            >
              1v1
            </span>
          </button>
        </div>

        <button
          onClick={handleStart}
          className="relative w-full h-16 rounded-2xl overflow-hidden active:scale-95 transition-transform"
        >
          <img 
            src="/ui/buttons/start-btn.png" 
            alt="Start" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <span 
            className="relative z-10 text-white font-bold text-2xl"
            style={{ textShadow }}
          >
            {selectedMode === 'solo' ? 'TAP TO START' : 'FIND OPPONENT'}
          </span>
        </button>
      </div>
    </div>
  );
}