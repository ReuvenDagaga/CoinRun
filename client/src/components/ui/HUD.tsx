import { useGameStore, selectActiveSpeedEffect, selectSpeedMultiplier, selectPlayerCoins } from '@/store/gameStore';

// Track length constant
const TRACK_LENGTH = 800;

export default function HUD() {
  const { status, player, elapsedTime, countdown } = useGameStore();
  const activeSpeedEffect = useGameStore(selectActiveSpeedEffect);
  const speedMultiplier = useGameStore(selectSpeedMultiplier);
  const coinsCollected = useGameStore(selectPlayerCoins);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Countdown display
  if (status === 'countdown') {
    return (
      <div className="absolute inset-0 flex items-center justify-center z-50">
        <div className="text-9xl font-bold text-white drop-shadow-lg animate-pulse">
          {Math.ceil(countdown)}
        </div>
      </div>
    );
  }

  if (status !== 'playing') return null;

  // Calculate progress percentage
  const progress = Math.min((player.distanceTraveled / TRACK_LENGTH) * 100, 100);
  const distanceLeft = Math.max(0, TRACK_LENGTH - player.distanceTraveled);

  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      {/* Top bar - Distance, Army, and Time */}
      <div className="absolute top-0 left-0 right-0 p-4">
        {/* Top row - Distance, Army count, Timer */}
        <div className="flex items-center justify-between gap-2">
          {/* Distance counter - Left */}
          <div className="bg-black/50 px-3 py-2 rounded-lg">
            <div className="text-white text-lg font-bold font-mono">
              {Math.floor(player.distanceTraveled)}m / {TRACK_LENGTH}m
            </div>
          </div>

          {/* Army counter - Center */}
          <div className="bg-blue-600/70 px-4 py-2 rounded-lg">
            <div className="text-white text-lg font-bold flex items-center gap-2">
              <span className="text-blue-200">Army:</span>
              <span className="text-2xl">{player.armyCount}</span>
            </div>
          </div>

          {/* Timer - Right */}
          <div className="bg-black/50 px-3 py-2 rounded-lg">
            <span className="text-white font-mono font-bold text-lg">
              {formatTime(elapsedTime)}
            </span>
          </div>
        </div>

        {/* Coin counter - below main stats */}
        <div className="mt-2 flex justify-start">
          <div className="bg-yellow-600/70 px-4 py-2 rounded-lg flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <span className="text-yellow-100 text-xl font-bold">{coinsCollected}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="h-3 bg-gray-800/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Distance remaining label */}
          <div className="text-center mt-1">
            <span className="text-white/80 text-sm font-medium">
              {distanceLeft > 0 ? `${Math.floor(distanceLeft)}m remaining` : 'FINISH!'}
            </span>
          </div>
        </div>

        {/* Active Speed Effect Indicator */}
        {activeSpeedEffect && (
          <div className="mt-3 flex justify-center">
            <div
              className={`px-4 py-2 rounded-lg text-white font-bold text-lg animate-pulse ${
                activeSpeedEffect.type === 'boost'
                  ? 'bg-green-500/80'
                  : 'bg-red-500/80'
              }`}
            >
              {activeSpeedEffect.type === 'boost' ? '⚡ SPEED BOOST!' : '🐢 SLOWED!'}
              <span className="ml-2 text-sm opacity-80">
                {speedMultiplier > 1 ? `+${Math.round((speedMultiplier - 1) * 100)}%` : `-${Math.round((1 - speedMultiplier) * 100)}%`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Control hints - Bottom */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        <div className="bg-black/30 px-4 py-2 rounded-lg text-white/60 text-sm">
          Arrow Keys / Swipe to move left/right
        </div>
      </div>
    </div>
  );
}

// Victory screen shown when player finishes
export function VictoryScreen() {
  const { status, result, reset } = useGameStore();

  if (status !== 'finished') return null;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/70">
      <div className="bg-gradient-to-b from-green-600 to-green-800 p-8 rounded-2xl shadow-2xl text-center max-w-md mx-4">
        <h1 className="text-5xl font-bold text-white mb-4">VICTORY!</h1>

        <div className="space-y-3 mb-6">
          <div className="bg-white/20 rounded-lg p-3">
            <div className="text-white/80 text-sm">Distance</div>
            <div className="text-white text-2xl font-bold">
              {Math.floor(result?.distanceTraveled || 0)}m
            </div>
          </div>

          <div className="bg-white/20 rounded-lg p-3">
            <div className="text-white/80 text-sm">Time</div>
            <div className="text-white text-2xl font-bold">
              {formatTime(result?.timeTaken || 0)}
            </div>
          </div>

          <div className="bg-blue-500/30 rounded-lg p-3">
            <div className="text-blue-200 text-sm">Army Size</div>
            <div className="text-white text-2xl font-bold">
              {result?.maxArmy || 1} soldiers
            </div>
          </div>

          <div className="bg-yellow-600/30 rounded-lg p-3">
            <div className="text-yellow-200 text-sm">Coins Collected</div>
            <div className="text-white text-2xl font-bold flex items-center justify-center gap-2">
              <span>💰</span>
              <span>{result?.coinsCollected || 0}</span>
            </div>
          </div>

          <div className="bg-yellow-500/30 rounded-lg p-3">
            <div className="text-yellow-200 text-sm">Score</div>
            <div className="text-white text-2xl font-bold">
              {result?.finalScore?.toLocaleString() || 0}
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            reset();
            window.location.reload();
          }}
          className="w-full bg-white text-green-700 font-bold py-3 px-6 rounded-xl hover:bg-green-100 transition-colors pointer-events-auto"
        >
          PLAY AGAIN
        </button>
      </div>
    </div>
  );
}

// Pause button (for solo mode)
export function PauseButton() {
  const { pauseGame, gameMode, status } = useGameStore();

  if (gameMode === '1v1' || status !== 'playing') return null;

  return (
    <button
      onClick={pauseGame}
      className="absolute top-4 right-20 z-50 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center pointer-events-auto hover:bg-black/70 transition-colors"
    >
      <span className="text-white text-xl">||</span>
    </button>
  );
}

// Pause overlay
export function PauseOverlay() {
  const { status, resumeGame, reset } = useGameStore();

  if (status !== 'paused') return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/70">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl text-center">
        <h2 className="text-3xl font-bold text-white mb-6">PAUSED</h2>

        <div className="space-y-3">
          <button
            onClick={resumeGame}
            className="w-full bg-green-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-green-500 transition-colors pointer-events-auto"
          >
            RESUME
          </button>

          <button
            onClick={() => {
              reset();
              window.location.href = '/';
            }}
            className="w-full bg-red-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-red-500 transition-colors pointer-events-auto"
          >
            QUIT
          </button>
        </div>
      </div>
    </div>
  );
}
