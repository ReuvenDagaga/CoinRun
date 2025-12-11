import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { calculatePowerLevel, getStartingArmy, getMaxArmy } from '@shared/types/game.types';
import UpgradeCard from './UpgradeCard';

export default function PreGame() {
  const navigate = useNavigate();
  const { user, powerLevel } = useUserStore();
  const [selectedMode, setSelectedMode] = useState<'solo' | '1v1'>('solo');

  if (!user) return null;

  const startingArmy = getStartingArmy(user.upgrades.addWarrior);
  const maxArmy = getMaxArmy(user.upgrades.capacity);

  const handleStart = () => {
    navigate(`/game/${selectedMode}`);
  };

  return (
    <div className="h-full flex flex-col p-4 overflow-hidden">
      {/* Header - Fixed */}
      <div className="text-center flex-shrink-0">
        <h1 className="text-2xl font-bold text-white mb-2">
          Power Level: <span className="text-orange-400">{powerLevel}</span>
        </h1>

        {/* Character preview area */}
        <div className="w-24 h-24 mx-auto bg-gray-700/50 rounded-full flex items-center justify-center mb-3 border-4 border-orange-400 shadow-lg">
          <div className="text-5xl">🏃</div>
        </div>

        <div className="flex justify-center gap-3 text-sm mb-3">
          <div className="bg-gray-700/50 px-3 py-1.5 rounded-lg border border-green-500/30">
            <span className="text-green-400">👥</span>
            <span className="text-white ml-1">{startingArmy} start</span>
          </div>
          <div className="bg-gray-700/50 px-3 py-1.5 rounded-lg border border-blue-500/30">
            <span className="text-blue-400">📊</span>
            <span className="text-white ml-1">{maxArmy} max</span>
          </div>
        </div>
      </div>

      {/* Upgrades grid - Scrollable area */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollable-content mb-3">
        <h2 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">Upgrades</h2>
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
          <button
            onClick={() => setSelectedMode('solo')}
            className={`flex-1 py-2.5 rounded-xl font-semibold transition-all duration-150 border-2 ${
              selectedMode === 'solo'
                ? 'bg-orange-500 text-white border-white shadow-lg'
                : 'bg-gray-700/50 text-gray-300 border-gray-600 hover:bg-gray-600/50'
            }`}
          >
            Solo Mode
          </button>
          <button
            onClick={() => setSelectedMode('1v1')}
            className={`flex-1 py-2.5 rounded-xl font-semibold transition-all duration-150 border-2 ${
              selectedMode === '1v1'
                ? 'bg-orange-500 text-white border-white shadow-lg'
                : 'bg-gray-700/50 text-gray-300 border-gray-600 hover:bg-gray-600/50'
            }`}
          >
            1v1 Betting
          </button>
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          className="w-full btn-gold text-lg py-3"
        >
          {selectedMode === 'solo' ? '🎮 TAP TO START' : '⚔️ FIND OPPONENT'}
        </button>

        {/* Balances */}
        <div className="flex justify-center gap-4 py-2">
          <div className="flex items-center gap-1.5 bg-gray-800/50 px-3 py-1.5 rounded-lg">
            <span className="text-yellow-400">💰</span>
            <span className="text-white font-bold text-sm">{user.coins.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-800/50 px-3 py-1.5 rounded-lg">
            <span className="text-purple-400">💎</span>
            <span className="text-white font-bold text-sm">{user.gems}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-800/50 px-3 py-1.5 rounded-lg">
            <span className="text-green-400">💵</span>
            <span className="text-white font-bold text-sm">${user.usdtBalance.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Betting mode selection with bet amounts
export function BettingModeSelector() {
  const [betAmount, setBetAmount] = useState<number>(1);
  const { user } = useUserStore();
  const navigate = useNavigate();

  const betOptions = [1, 2, 5, 10];

  const canBet = user && user.usdtBalance >= betAmount;

  const handleFindMatch = () => {
    if (canBet) {
      navigate(`/game/1v1?bet=${betAmount}`);
    }
  };

  return (
    <div className="bg-gray-800 rounded-2xl p-4">
      <h3 className="text-white font-semibold mb-3">Select Bet Amount</h3>

      <div className="grid grid-cols-4 gap-2 mb-4">
        {betOptions.map((amount) => (
          <button
            key={amount}
            onClick={() => setBetAmount(amount)}
            disabled={!user || user.usdtBalance < amount}
            className={`py-3 rounded-xl font-semibold transition-all ${
              betAmount === amount
                ? 'bg-green-500 text-white'
                : user && user.usdtBalance >= amount
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            ${amount}
          </button>
        ))}
      </div>

      <div className="text-center text-sm text-gray-400 mb-4">
        Win: <span className="text-green-400 font-bold">${(betAmount * 1.9).toFixed(2)}</span>
        <span className="ml-2">(10% fee)</span>
      </div>

      <button
        onClick={handleFindMatch}
        disabled={!canBet}
        className={`w-full py-4 rounded-xl font-bold text-lg ${
          canBet
            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }`}
      >
        {canBet ? '⚔️ Find Opponent' : 'Insufficient Balance'}
      </button>
    </div>
  );
}
