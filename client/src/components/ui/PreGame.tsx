import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/context';
import { calculatePowerLevel, getStartingArmy, getMaxArmy } from '@shared/types/game.types';
import UpgradeCard from './UpgradeCard';
import AssetButton, { StatDisplay, GamePanel } from './AssetButton';

export default function PreGame() {
  const navigate = useNavigate();
  const { userData, powerLevel } = useUser();
  const [selectedMode, setSelectedMode] = useState<'solo' | '1v1'>('solo');

  if (!userData) return null;
  const user = userData;

  const startingArmy = getStartingArmy(user.upgrades.addWarrior);
  const maxArmy = getMaxArmy(user.upgrades.capacity);

  const handleStart = () => {
    navigate(`/game/${selectedMode}`);
  };

  return (
    <div
      className="h-full flex flex-col p-4 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #4A90E2 0%, #87CEEB 50%, #98FB98 100%)'
      }}
    >
      {/* Header - Fixed */}
      <div className="text-center flex-shrink-0">
        <h1
          className="text-3xl font-bold mb-2"
          style={{
            color: '#FFFFFF',
            fontFamily: '"Comic Sans MS", "Bangers", sans-serif',
            textShadow: '3px 3px 0 #FF6B35, -1px -1px 0 #000'
          }}
        >
          Power Level: <span style={{ color: '#FFD700' }}>{powerLevel}</span>
        </h1>

        {/* Character preview area */}
        <div
          className="w-28 h-28 mx-auto rounded-full flex items-center justify-center mb-3"
          style={{
            background: 'linear-gradient(180deg, #FF6B35 0%, #D04A15 100%)',
            border: '4px solid #FFD700',
            boxShadow: '0 4px 20px rgba(255, 107, 53, 0.5)'
          }}
        >
          <div className="text-6xl">🏃</div>
        </div>

        <div className="flex justify-center gap-3 text-sm mb-3">
          <StatDisplay icon="👥" value={startingArmy} label="START" color="#32CD32" />
          <StatDisplay icon="📊" value={maxArmy} label="MAX" color="#00BFFF" />
        </div>
      </div>

      {/* Upgrades grid - Scrollable area */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollable-content mb-3">
        <h2
          className="text-sm font-semibold mb-2 uppercase tracking-wide"
          style={{
            color: '#FFFFFF',
            textShadow: '1px 1px 0 rgba(0,0,0,0.5)'
          }}
        >
          Upgrades
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <UpgradeCard type="capacity" />
          <UpgradeCard type="addWarrior" />
          <UpgradeCard type="warriorUpgrade" />
          <UpgradeCard type="income" />
          <UpgradeCard type="speed" />
          <UpgradeCard type="jump" />
          <UpgradeCard type="bulletPower" />
          <UpgradeCard type="magnetRadius" />
        </div>
      </div>

      {/* Bottom Section - Fixed */}
      <div className="flex-shrink-0 space-y-3">
        {/* Mode selection */}
        <div className="flex gap-2">
          <AssetButton
            label="Solo"
            icon="🎮"
            onClick={() => setSelectedMode('solo')}
            variant={selectedMode === 'solo' ? 'primary' : 'secondary'}
            size="medium"
            className="flex-1"
          />
          <AssetButton
            label="1v1"
            icon="⚔️"
            onClick={() => setSelectedMode('1v1')}
            variant={selectedMode === '1v1' ? 'primary' : 'secondary'}
            size="medium"
            className="flex-1"
          />
        </div>

        {/* Start button */}
        <AssetButton
          label={selectedMode === 'solo' ? 'TAP TO START' : 'FIND OPPONENT'}
          icon={selectedMode === 'solo' ? '🚀' : '🔍'}
          onClick={handleStart}
          variant="gold"
          size="large"
          className="w-full"
        />

        {/* Balances - VIRTUAL CURRENCIES ONLY */}
        <div className="flex justify-center gap-6 py-2">
          <StatDisplay icon="💰" value={user.coins.toLocaleString()} color="#FFD700" />
          <StatDisplay icon="💎" value={user.gems} color="#9370DB" />
        </div>
      </div>
    </div>
  );
}

/**
 * REMOVED: BettingModeSelector
 *
 * Betting with real currency (USDT) has been removed from the game.
 * All gameplay now uses virtual currencies (coins/gems) only.
 *
 * If betting needs to be re-implemented, use coins instead:
 * - Display coin bet amounts (e.g., 100, 500, 1000, 5000 coins)
 * - Winner takes all with house fee deducted
 * - No real money involved
 */

// Coin-based betting for 1v1 matches (VIRTUAL CURRENCY ONLY)
export function BettingModeSelector() {
  const [betAmount, setBetAmount] = useState<number>(100);
  const { userData } = useUser();
  const navigate = useNavigate();
  const user = userData;

  // Bet amounts in COINS (not real money)
  const betOptions = [100, 500, 1000, 5000];

  const canBet = user && user.coins >= betAmount;

  const handleFindMatch = () => {
    if (canBet) {
      navigate(`/game/1v1?bet=${betAmount}`);
    }
  };

  return (
    <div className="bg-gray-800 rounded-2xl p-4">
      <h3 className="text-white font-semibold mb-3">Select Coin Bet</h3>

      <div className="grid grid-cols-4 gap-2 mb-4">
        {betOptions.map((amount) => (
          <button
            key={amount}
            onClick={() => setBetAmount(amount)}
            disabled={!user || user.coins < amount}
            className={`py-3 rounded-xl font-semibold transition-all ${
              betAmount === amount
                ? 'bg-yellow-500 text-black'
                : user && user.coins >= amount
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            💰 {amount}
          </button>
        ))}
      </div>

      <div className="text-center text-sm text-gray-400 mb-4">
        Win: <span className="text-yellow-400 font-bold">💰 {Math.floor(betAmount * 1.9)}</span>
        <span className="ml-2">(10% fee)</span>
      </div>

      <button
        onClick={handleFindMatch}
        disabled={!canBet}
        className={`w-full py-4 rounded-xl font-bold text-lg ${
          canBet
            ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }`}
      >
        {canBet ? '⚔️ Find Opponent' : 'Insufficient Balance'}
      </button>
    </div>
  );
}
