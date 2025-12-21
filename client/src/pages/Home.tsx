import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CharacterSelector from '@/components/3d/CharacterSelector';
import FloatingNavManager from '@/components/home/floating-nav/FloatingNavManager';
import PowerLevelDisplay from '@/components/home/power-level/PowerLevelDisplay';
import ModeSelector, { GameMode } from '@/components/home/ModeSelector';
import PageReveal, { StaggerContainer, StaggerItem } from '@/components/ui/PageReveal';
import { CLIENT_CONSTANTS } from '@/utils/constants';
import UpgradesGrid from '@/components/home/upgrades/UpgradesGrid';
import { CONFIG } from '@/components/home/floating-nav/config';


export default function Home() {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<GameMode>('solo');


  const handleStart = async () => {
    if (selectedMode === '1v1') {
      navigate('/pvp/lobby');
    } else {
      navigate(`/game/${selectedMode}`);
    }
  };

  return (
    <PageReveal className="absolute inset-0">
      <div
        className="absolute inset-0 flex flex-col"
        style={{
          backgroundImage: `url(${CLIENT_CONSTANTS.HOME_BACKGROUND_IMAGE})`,
          backgroundSize: 'cover',
        }}
      >
        <div className="fixed top-14 left-0 right-0 z-50">
          <PowerLevelDisplay />
        </div>

        <StaggerContainer className="relative z-10 flex flex-col flex-1">
          <StaggerItem className="flex-1 min-h-[30vh] max-h-[55vh] mt-8">
            <CharacterSelector
              onTap={handleStart}
              tapText={selectedMode === 'solo' ? 'Tap to Start' : 'Find Opponent'}
            />
          </StaggerItem>

          <div className="fixed bottom-4 left-0 right-0 px-2 sm:px-4 pb-28 sm:pb-32 space-y-2">
            <StaggerItem>
              <UpgradesGrid />
            </StaggerItem>
            <StaggerItem>
              <ModeSelector selectedMode={selectedMode} onModeChange={setSelectedMode} />
            </StaggerItem>
          </div>
        </StaggerContainer>

        <FloatingNavManager
          rightButtons={CONFIG.RIGHT_BUTTONS}
        />
      </div>
    </PageReveal>
  );
}
