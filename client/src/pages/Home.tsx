// pages/Home.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import TextWithShadow from '@/components/TextWithShadow';
import CharacterSelector from '@/components/3d/CharacterSelector';
import { useGameTransition } from '@/components/ui/GameTransitionGuard';

// Background image path - can be customized
const HOME_BACKGROUND_IMAGE = '/ui/home-bg.png';

interface UpgradeType {
  key: string;
  name: string;
  icon: string;
  headerColor: string;
  bgColor: string;
  borderColor: string;
}

const upgrades: UpgradeType[] = [
  {
    key: 'addWarrior',
    name: 'Add Warrior',
    icon: '/ui/AddWarriors.Png',
    headerColor: '#7cb342',
    bgColor: '#c5e1a5',
    borderColor: '#aed581'
  },
  {
    key: 'warriorUpgrade',
    name: 'Warrior Upgrade',
    icon: '/ui/Power.Png',
    headerColor: '#5c6bc0',
    bgColor: '#c5cae9',
    borderColor: '#9fa8da'
  },
  {
    key: 'income',
    name: 'Income',
    icon: '/ui/Income.Png',
    headerColor: '#26a69a',
    bgColor: '#b2dfdb',
    borderColor: '#80cbc4'
  },
  {
    key: 'speed',
    name: 'Speed',
    icon: '/ui/Speed.Png',
    headerColor: '#ef5350',
    bgColor: '#ffcdd2',
    borderColor: '#ef9a9a'
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { user, powerLevel, purchaseUpgrade, getUpgradeCost, canAffordUpgrade } = useAuth();
  const [selectedMode, setSelectedMode] = useState<'solo' | '1v1'>('solo');
  const { startGameTransition, completeTransition } = useGameTransition();

  if (!user) return null;

  const handleStart = async () => {
    // Show loading screen during transition
    await startGameTransition();

    // Navigate to PvP lobby for 1v1, regular game for solo
    if (selectedMode === '1v1') {
      navigate('/pvp/lobby');
    } else {
      navigate(`/game/${selectedMode}`);
    }

    // Complete transition after navigation
    setTimeout(completeTransition, 500);
  };

  const handleUpgrade = async (type: string) => {
    await purchaseUpgrade(type as any);
  };

  return (
    <div
      className="absolute inset-0 flex flex-col mt-20"
      style={{
        backgroundImage: `url(${HOME_BACKGROUND_IMAGE})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Semi-transparent overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50 pointer-events-none" />

      <div className="relative z-10 flex-shrink-0 pt-2 px-4 text-center">
        <TextWithShadow className="text-xs sm:text-sm text-white/80 font-semibold">
          Power Level
        </TextWithShadow>
        <TextWithShadow className="text-2xl sm:text-3xl font-bold text-yellow-400">
          {powerLevel}
        </TextWithShadow>
      </div>

      <div className="relative z-10 flex-1 min-h-[150px]">
        <CharacterSelector />
      </div>

      <div className="relative z-10 flex-shrink-0 px-2 sm:px-4 pb-28 sm:pb-32 space-y-2">
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {upgrades.map((upgrade) => {
            const level = user.upgrades[upgrade.key as keyof typeof user.upgrades] || 0;
            const cost = getUpgradeCost(upgrade.key as any);
            const canAfford = canAffordUpgrade(upgrade.key as any);

            return (
              <div
                key={upgrade.key}
                className={`relative rounded-xl overflow-hidden active:scale-95 transition-transform ${canAfford ? 'cursor-pointer' : 'opacity-50'
                  }`}
                onClick={() => canAfford && handleUpgrade(upgrade.key)}
                style={{
                  backgroundColor: upgrade.bgColor,
                  border: `3px solid ${upgrade.borderColor}`
                }}
              >
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
                      className={`font-bold text-[15px] sm:text-[15px] uppercase leading-tight ${canAfford ? 'text-green-400' : 'text-red-500'
                        }`}
                    >
                      {cost}
                    </TextWithShadow>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setSelectedMode('solo')}
            className={`relative rounded-xl overflow-hidden transition-all active:scale-95 ${selectedMode !== 'solo' ? 'opacity-50' : ''
              }`}
          >
            <img
              src="/ui/Solo.Png"
              alt="Solo"
              className="w-full h-auto"
            />
            <TextWithShadow as="span" className="absolute inset-0 flex items-center justify-center text-white font-bold text-base sm:text-xl">
              Solo
            </TextWithShadow>
          </button>
          <button
            onClick={() => setSelectedMode('1v1')}
            className={`relative rounded-xl overflow-hidden transition-all active:scale-95 ${selectedMode !== '1v1' ? 'opacity-50' : ''
              }`}
          >
            <img
              src="/ui/1v1.Png"
              alt="1v1"
              className="w-full h-auto"
            />
            <TextWithShadow as="span" className="absolute inset-0 flex items-center justify-center text-white font-bold text-base sm:text-xl">
              1v1
            </TextWithShadow>
          </button>
        </div>

        <button
          onClick={handleStart}
          className="relative w-full rounded-xl sm:rounded-2xl overflow-hidden active:scale-95 transition-transform"
        >
          <img
            src="/ui/Play.Png"
            alt="Start"
            className="w-full h-auto"
          />
          <div className="absolute inset-0 flex items-center justify-center gap-2">
            <TextWithShadow as="span" className="text-white font-bold text-lg sm:text-xl">
              {selectedMode === 'solo' ? 'PLAY' : 'FIND OPPONENT'}
            </TextWithShadow>
            {selectedMode === '1v1' && (
              <img
                src="/ui/Search.Png"
                alt="Search"
                className="w-5 h-5 sm:w-6 sm:h-6"
              />
            )}
          </div>
        </button>
      </div>
    </div>
  );
}