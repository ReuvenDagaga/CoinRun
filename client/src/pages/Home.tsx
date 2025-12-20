import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import CharacterSelector from '@/components/3d/CharacterSelector';
import { useGameTransition } from '@/components/ui/GameTransitionGuard';
import FloatingNavManager from '@/components/ui/FloatingNavManager';
import { BagIcon } from '@/icons';
import PowerLevelDisplay from '@/components/home/PowerLevelDisplay';
import UpgradesGrid from '@/components/home/UpgradesGrid';
import ModeSelector, { GameMode } from '@/components/home/ModeSelector';
import PlayButton from '@/components/home/PlayButton';

const HOME_BACKGROUND_IMAGE = '/ui/home-bg.png';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedMode, setSelectedMode] = useState<GameMode>('solo');
  const { startGameTransition, completeTransition } = useGameTransition();

  if (!user) return null;

  const handleStart = async () => {
    await startGameTransition();

    if (selectedMode === '1v1') {
      navigate('/pvp/lobby');
    } else {
      navigate(`/game/${selectedMode}`);
    }

    setTimeout(completeTransition, 500);
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
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50 pointer-events-none" />

      <div className="relative z-10 flex-shrink-0">
        <PowerLevelDisplay />
      </div>

      <div className="relative z-10 flex-1 min-h-[150px]">
        <CharacterSelector />
      </div>

      <div className="relative z-10 flex-shrink-0 px-2 sm:px-4 pb-28 sm:pb-32 space-y-2">
        <UpgradesGrid />
        <ModeSelector selectedMode={selectedMode} onModeChange={setSelectedMode} />
        <PlayButton selectedMode={selectedMode} onPlay={handleStart} />
      </div>

      <FloatingNavManager
        rightButtons={[
          {
            id: 'inventory',
            icon: <BagIcon size={28} />,
            label: 'Asset Inventory',
            href: '/inventory',
            variant: 'info',
            size: 'lg',
            enabled: true
          }
        ]}
        baseTopOffset={120}
      />
    </div>
  );
}
