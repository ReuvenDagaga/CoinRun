import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useUIStore } from '@/store/uiStore';
import { GateType, GAME_CONSTANTS } from '@shared/types/game.types';

export default function HUD() {
  const { status, player, elapsedTime, countdown, activePowerUps, track, gameMode, opponentProgress } = useGameStore();
  const { floatingTexts } = useUIStore();

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress
  const progress = track ? (player.distanceTraveled / track.totalLength) * 100 : 0;

  // Countdown display
  if (status === 'countdown') {
    return (
      <div className="absolute inset-0 flex items-center justify-center z-50">
        <div className="text-8xl font-bold text-white animate-pulse">
          {Math.ceil(countdown)}
        </div>
      </div>
    );
  }

  if (status !== 'playing') return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
        {/* Coins & Army */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-full">
            <span className="text-yellow-400 text-xl">💰</span>
            <span className="text-white font-bold">{player.coinsCollected}</span>
          </div>
          <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-full">
            <span className="text-green-400 text-xl">👥</span>
            <span className="text-white font-bold">{player.armyCount}</span>
          </div>
        </div>

        {/* Active power-ups */}
        <div className="flex items-center gap-2">
          {activePowerUps.map((powerUp) => (
            <PowerUpIndicator key={powerUp.type} type={powerUp.type} time={powerUp.remainingTime} />
          ))}
        </div>

        {/* Time */}
        <div className="bg-black/30 px-3 py-1.5 rounded-full">
          <span className="text-white font-mono font-bold">{formatTime(elapsedTime)}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute top-16 left-4 right-4">
        <div className="h-2 bg-gray-800/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
          {/* Opponent progress in 1v1 */}
          {gameMode === '1v1' && (
            <div
              className="absolute top-0 h-full w-1 bg-red-500"
              style={{ left: `${opponentProgress}%` }}
            />
          )}
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-400">
          <span>0m</span>
          <span>{Math.floor(player.distanceTraveled)}m / {track?.totalLength || 2000}m</span>
        </div>
      </div>

      {/* Opponent info (1v1 mode) */}
      {gameMode === '1v1' && (
        <div className="absolute top-28 left-4 right-4 flex items-center gap-2 bg-black/30 p-2 rounded-lg">
          <span className="text-red-400 font-semibold">Opponent:</span>
          <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all"
              style={{ width: `${opponentProgress}%` }}
            />
          </div>
          <span className="text-xs text-gray-400">{Math.floor(opponentProgress)}%</span>
        </div>
      )}

      {/* Floating texts */}
      {floatingTexts.map((text) => (
        <div
          key={text.id}
          className="floating-text"
          style={{
            left: `${text.x}%`,
            top: `${text.y}%`,
            color: text.color
          }}
        >
          {text.text}
        </div>
      ))}

      {/* Distance milestone notifications */}
      <DistanceMilestones distance={player.distanceTraveled} />
    </div>
  );
}

interface PowerUpIndicatorProps {
  type: GateType;
  time: number;
}

function PowerUpIndicator({ type, time }: PowerUpIndicatorProps) {
  const icons: Record<GateType, string> = {
    [GateType.ADD]: '➕',
    [GateType.MULTIPLY]: '✖️',
    [GateType.SPEED]: '⚡',
    [GateType.SHIELD]: '🛡️',
    [GateType.MAGNET]: '🧲',
    [GateType.BULLETS]: '🔫'
  };

  const colors: Record<GateType, string> = {
    [GateType.ADD]: 'bg-green-500',
    [GateType.MULTIPLY]: 'bg-yellow-500',
    [GateType.SPEED]: 'bg-blue-500',
    [GateType.SHIELD]: 'bg-purple-500',
    [GateType.MAGNET]: 'bg-pink-500',
    [GateType.BULLETS]: 'bg-red-500'
  };

  return (
    <div className={`${colors[type]} px-2 py-1 rounded-lg flex items-center gap-1`}>
      <span>{icons[type]}</span>
      <span className="text-white text-xs font-bold">{Math.ceil(time)}s</span>
    </div>
  );
}

function DistanceMilestones({ distance }: { distance: number }) {
  const [showMilestone, setShowMilestone] = useState<number | null>(null);

  useEffect(() => {
    const milestones = [500, 1000, 1500, 1800];
    const currentMilestone = milestones.find(m => distance >= m && distance < m + 10);

    if (currentMilestone && showMilestone !== currentMilestone) {
      setShowMilestone(currentMilestone);
      setTimeout(() => setShowMilestone(null), 2000);
    }
  }, [distance, showMilestone]);

  if (!showMilestone) return null;

  const remaining = 2000 - showMilestone;

  return (
    <div className="absolute bottom-20 left-0 right-0 flex justify-center animate-bounce">
      <div className="bg-black/80 px-6 py-3 rounded-full">
        <span className="text-white text-lg font-bold">
          🏁 {remaining}m remaining!
        </span>
      </div>
    </div>
  );
}

// Pause button (optional, for solo mode)
export function PauseButton() {
  const { pauseGame, gameMode } = useGameStore();

  if (gameMode === '1v1') return null; // Can't pause in 1v1

  return (
    <button
      onClick={pauseGame}
      className="absolute top-4 right-4 z-50 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center pointer-events-auto"
    >
      <span className="text-white text-xl">⏸️</span>
    </button>
  );
}
