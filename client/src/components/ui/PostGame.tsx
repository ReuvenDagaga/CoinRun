import { useNavigate } from 'react-router-dom';
import { useGame } from '@/context';

export default function PostGame() {
  const navigate = useNavigate();
  const { status, result, gameMode, reset } = useGame();

  const isVictory = status === 'finished';

  if (!result) return null;

  const handlePlayAgain = () => {
    reset();
    // Reload to get fresh random track
    window.location.reload();
  };

  const handleQuit = () => {
    reset();
    navigate('/');
  };

  // Format time as M:SS.ms
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className={`rounded-3xl p-8 w-full max-w-md shadow-2xl ${
        isVictory
          ? 'bg-gradient-to-b from-green-600 to-green-800'
          : 'bg-gradient-to-b from-gray-700 to-gray-900'
      }`}>
        {/* Header */}
        <div className="text-center mb-8">
          {isVictory ? (
            <>
              <div className="text-7xl mb-4">🏆</div>
              <h1 className="text-4xl font-bold text-white">VICTORY!</h1>
              <p className="text-green-200 mt-2">You reached the finish line!</p>
            </>
          ) : (
            <>
              <div className="text-7xl mb-4">😔</div>
              <h1 className="text-4xl font-bold text-white">GAME OVER</h1>
              <p className="text-gray-400 mt-2">Better luck next time!</p>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="space-y-4 mb-8">
          <div className="bg-white/20 rounded-xl p-4">
            <div className="text-white/70 text-sm">Distance Traveled</div>
            <div className="text-white text-3xl font-bold">
              {Math.floor(result.distanceTraveled)}m
            </div>
          </div>

          <div className="bg-white/20 rounded-xl p-4">
            <div className="text-white/70 text-sm">Time</div>
            <div className="text-white text-3xl font-bold">
              {formatTime(result.timeTaken)}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={handlePlayAgain}
            className="flex-1 bg-white text-gray-800 font-bold py-4 px-6 rounded-xl hover:bg-gray-100 transition-colors text-lg"
          >
            Play Again
          </button>
          <button
            onClick={handleQuit}
            className="flex-1 bg-white/20 text-white font-bold py-4 px-6 rounded-xl hover:bg-white/30 transition-colors text-lg"
          >
            Quit
          </button>
        </div>
      </div>
    </div>
  );
}
