import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { useUserStore } from '@/store/userStore';
import { getIncomeMultiplier, calculateScore } from '@shared/types/game.types';

export default function PostGame() {
  const navigate = useNavigate();
  const { status, result, gameMode, reset } = useGameStore();
  const { user, addCoins, updateStats } = useUserStore();

  const isVictory = status === 'finished';
  const isGameOver = status === 'gameover';

  // Apply rewards
  useEffect(() => {
    if (!result || !user) return;

    // Calculate coin rewards
    const incomeMultiplier = getIncomeMultiplier(user.upgrades.income);
    const baseReward = 50 +
      result.coinsCollected +
      result.maxArmy * 2 +
      Math.max(0, (120 - result.timeTaken) * 2) +
      result.enemiesKilled * 5;

    const finalReward = Math.floor(baseReward * incomeMultiplier);

    // Add coins
    addCoins(finalReward);

    // Update stats
    updateStats({
      coinsCollected: result.coinsCollected,
      distanceTraveled: result.distanceTraveled,
      won: isVictory,
      armySize: result.maxArmy
    });
  }, [result]);

  if (!result) return null;

  const handlePlayAgain = () => {
    reset();
    navigate(`/game/${gameMode}`);
  };

  const handleUpgrade = () => {
    reset();
    navigate('/');
  };

  const incomeMultiplier = user ? getIncomeMultiplier(user.upgrades.income) : 1;
  const baseReward = result ? (
    50 +
    result.coinsCollected +
    result.maxArmy * 2 +
    Math.max(0, (120 - result.timeTaken) * 2) +
    result.enemiesKilled * 5
  ) : 0;
  const finalReward = Math.floor(baseReward * incomeMultiplier);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl p-6 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          {isVictory ? (
            <>
              <div className="text-6xl mb-2">🎉</div>
              <h1 className="text-3xl font-bold text-white">GAME COMPLETE!</h1>
            </>
          ) : (
            <>
              <div className="text-6xl mb-2">💀</div>
              <h1 className="text-3xl font-bold text-red-400">GAME OVER</h1>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="space-y-3 mb-6">
          <StatRow label="Final Score" value={result.finalScore.toLocaleString()} highlight />
          <StatRow label="Distance" value={`${Math.floor(result.distanceTraveled)}m`} />
          <StatRow label="Army Size" value={result.maxArmy.toString()} />
          <StatRow label="Time" value={formatTime(result.timeTaken)} />
          <StatRow label="Coins Collected" value={result.coinsCollected.toString()} icon="💰" />
          <StatRow label="Enemies Defeated" value={result.enemiesKilled.toString()} icon="⚔️" />
        </div>

        {/* Rewards */}
        <div className="bg-yellow-500/20 rounded-xl p-4 mb-6">
          <h3 className="text-yellow-400 font-semibold mb-2">Rewards</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💰</span>
              <span className="text-white text-xl font-bold">+{finalReward}</span>
              {incomeMultiplier > 1 && (
                <span className="text-green-400 text-sm">
                  (×{incomeMultiplier.toFixed(2)})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🏆</span>
              <span className="text-white font-bold">+{Math.floor(result.finalScore / 100)} XP</span>
            </div>
          </div>
        </div>

        {/* High score indicator */}
        {result.finalScore > 20000 && (
          <div className="text-center mb-4 animate-pulse">
            <span className="text-yellow-400 text-lg font-bold">
              ⭐ New High Score! ⭐
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handlePlayAgain}
            className="flex-1 btn-primary"
          >
            🔄 Play Again
          </button>
          <button
            onClick={handleUpgrade}
            className="flex-1 btn-gold"
          >
            ⬆️ Upgrade
          </button>
        </div>
      </div>
    </div>
  );
}

interface StatRowProps {
  label: string;
  value: string;
  icon?: string;
  highlight?: boolean;
}

function StatRow({ label, value, icon, highlight }: StatRowProps) {
  return (
    <div className={`flex justify-between items-center ${highlight ? 'text-lg' : ''}`}>
      <span className={`${highlight ? 'text-white font-semibold' : 'text-gray-400'}`}>
        {icon && <span className="mr-2">{icon}</span>}
        {label}
      </span>
      <span className={`font-bold ${highlight ? 'text-primary-400 text-xl' : 'text-white'}`}>
        {value}
      </span>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Betting result screen
export function BettingResult() {
  const navigate = useNavigate();
  const { result, gameMode, reset } = useGameStore();
  const { user, addUsdt } = useUserStore();

  // Mock betting data - in real app this would come from server
  const betAmount = 5;
  const isWinner = result?.didFinish;
  const winnings = isWinner ? betAmount * 1.9 : 0;

  useEffect(() => {
    if (isWinner && gameMode === '1v1') {
      addUsdt(winnings);
    }
  }, [isWinner, gameMode, winnings]);

  if (!result) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl p-6 w-full max-w-md">
        {/* Result header */}
        <div className="text-center mb-6">
          {isWinner ? (
            <>
              <div className="text-6xl mb-2">🏆</div>
              <h1 className="text-3xl font-bold text-green-400">YOU WIN!</h1>
            </>
          ) : (
            <>
              <div className="text-6xl mb-2">😔</div>
              <h1 className="text-3xl font-bold text-red-400">YOU LOSE</h1>
            </>
          )}
        </div>

        {/* Betting result */}
        <div className={`rounded-xl p-4 mb-6 ${isWinner ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
          <div className="text-center">
            <span className="text-gray-400">Bet: ${betAmount}</span>
            <div className={`text-3xl font-bold ${isWinner ? 'text-green-400' : 'text-red-400'}`}>
              {isWinner ? `+$${winnings.toFixed(2)}` : `-$${betAmount.toFixed(2)}`}
            </div>
          </div>
        </div>

        {/* Match stats */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-400">Your Score</span>
            <span className="text-white font-bold">{result.finalScore.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Opponent Score</span>
            <span className="text-white font-bold">18,500</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              reset();
              navigate('/');
            }}
            className="flex-1 btn-secondary"
          >
            Home
          </button>
          <button
            onClick={() => {
              reset();
              navigate('/game/1v1');
            }}
            className="flex-1 btn-primary"
          >
            Rematch
          </button>
        </div>
      </div>
    </div>
  );
}
