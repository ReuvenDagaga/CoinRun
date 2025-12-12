import { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import GameScene from '@/components/game/GameScene';
import HUD from '@/components/ui/HUD';
import PostGame from '@/components/ui/PostGame';
import { useGame, useUser } from '@/context';

export default function Game() {
  const { mode = 'solo' } = useParams<{ mode?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { status, reset } = useGame();
  const { userData } = useUser();

  // Validate mode
  const gameMode = mode === '1v1' ? '1v1' : 'solo';

  // Get bet amount for 1v1 mode
  const betAmount = gameMode === '1v1' ? Number(searchParams.get('bet')) || 1 : 0;

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Only reset if leaving the game page
    };
  }, []);

  // Handle back button
  useEffect(() => {
    const handlePopState = () => {
      reset();
      navigate('/');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [reset, navigate]);

  if (!userData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="spinner" />
      </div>
    );
  }

  const showPostGame = status === 'finished' || status === 'gameover';

  return (
    <div className="w-full h-screen bg-gray-900 overflow-hidden touch-none no-select">
      {/* 3D Game Scene */}
      <GameScene mode={gameMode} />

      {/* HUD overlay */}
      <HUD />

      {/* Post-game screen */}
      {showPostGame && <PostGame />}

      {/* Pause menu (for solo mode) */}
      {status === 'paused' && <PauseMenu />}
    </div>
  );
}

function PauseMenu() {
  const { resumeGame, reset } = useGame();
  const navigate = useNavigate();

  const handleQuit = () => {
    reset();
    navigate('/');
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl p-6 w-80">
        <h2 className="text-2xl font-bold text-white text-center mb-6">PAUSED</h2>

        <div className="space-y-3">
          <button
            onClick={resumeGame}
            className="w-full btn-primary"
          >
            ▶️ Resume
          </button>

          <button
            onClick={handleQuit}
            className="w-full btn-secondary"
          >
            🏠 Quit to Menu
          </button>
        </div>

        {/* Settings */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <h3 className="text-gray-400 text-sm mb-3">Settings</h3>
          <SettingsToggle label="Sound" />
          <SettingsToggle label="Music" />
          <SettingsToggle label="Vibration" />
        </div>
      </div>
    </div>
  );
}

function SettingsToggle({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-gray-300">{label}</span>
      <button className="w-12 h-6 bg-primary-500 rounded-full relative">
        <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
      </button>
    </div>
  );
}
