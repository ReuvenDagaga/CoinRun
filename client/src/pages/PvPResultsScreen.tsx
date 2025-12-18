/**
 * PvP Results Screen - Shows match results and rewards
 * Displays winner, scores, and distributes rewards
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PVP_CONSTANTS } from '../../../shared/types/pvp.types';

interface MatchResult {
  winnerId: string | null;
  player1: {
    userId: string;
    username: string;
    soldiers: number;
    completionTime: number;
    score: number;
  };
  player2: {
    userId: string;
    username: string;
    soldiers: number;
    completionTime: number;
    score: number;
  };
  winCondition: string;
}

export function PvPResultsScreen() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [result, setResult] = useState<MatchResult | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>(''); // Would come from auth context
  const [showRewards, setShowRewards] = useState(false);

  // Mock result for demonstration
  useEffect(() => {
    // In real implementation, this would come from the game finished event
    // or fetched from the server
    setTimeout(() => {
      setResult({
        winnerId: 'player1',
        player1: {
          userId: 'player1',
          username: 'You',
          soldiers: 45,
          completionTime: 120000,
          score: 450 + 150
        },
        player2: {
          userId: 'player2',
          username: 'Opponent',
          soldiers: 38,
          completionTime: 135000,
          score: 380 + 75
        },
        winCondition: 'HIGHER_SCORE'
      });
      setCurrentUserId('player1');
    }, 500);

    // Show rewards after 2 seconds
    setTimeout(() => {
      setShowRewards(true);
    }, 2500);
  }, [roomId]);

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-2xl">Calculating results...</div>
      </div>
    );
  }

  const isWinner = result.winnerId === currentUserId;
  const isDraw = result.winnerId === null;
  const myStats = result.player1.userId === currentUserId ? result.player1 : result.player2;
  const opponentStats = result.player1.userId === currentUserId ? result.player2 : result.player1;

  const winnerCoins = Math.floor(PVP_CONSTANTS.ENTRY_FEE * PVP_CONSTANTS.WINNER_MULTIPLIER);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Winner Announcement */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.8 }}
          className="text-center mb-8"
        >
          {isDraw ? (
            <>
              <div className="text-8xl mb-4">🤝</div>
              <h1 className="text-6xl font-bold text-white mb-2">Draw!</h1>
              <p className="text-xl text-blue-200">Evenly matched!</p>
            </>
          ) : isWinner ? (
            <>
              <div className="text-8xl mb-4">🏆</div>
              <h1 className="text-6xl font-bold text-yellow-400 mb-2">Victory!</h1>
              <p className="text-xl text-blue-200">You defeated {opponentStats.username}</p>
            </>
          ) : (
            <>
              <div className="text-8xl mb-4">😔</div>
              <h1 className="text-6xl font-bold text-gray-400 mb-2">Defeat</h1>
              <p className="text-xl text-blue-200">{opponentStats.username} was victorious</p>
            </>
          )}
        </motion.div>

        {/* Confetti for winner */}
        {isWinner && (
          <div className="fixed inset-0 pointer-events-none">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-2xl"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: -50,
                  rotate: 0
                }}
                animate={{
                  y: window.innerHeight + 50,
                  rotate: 360
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  delay: Math.random() * 0.5
                }}
              >
                {['🎉', '🎊', '✨', '⭐'][Math.floor(Math.random() * 4)]}
              </motion.div>
            ))}
          </div>
        )}

        {/* Score Breakdown */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6"
        >
          <h2 className="text-2xl font-bold text-white text-center mb-6">Match Statistics</h2>

          <div className="grid grid-cols-2 gap-4">
            {/* Your Stats */}
            <div className={`rounded-xl p-6 ${isWinner ? 'bg-green-500/20 border-2 border-green-400' : 'bg-gray-700/30'}`}>
              <h3 className="text-lg font-bold text-white mb-4">{myStats.username}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Soldiers:</span>
                  <span className="text-white font-bold">{myStats.soldiers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Time:</span>
                  <span className="text-white font-bold">{(myStats.completionTime / 1000).toFixed(1)}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Soldier Points:</span>
                  <span className="text-white font-bold">{myStats.soldiers * PVP_CONSTANTS.SOLDIER_POINTS}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Time Bonus:</span>
                  <span className="text-white font-bold">
                    {Math.floor(((150000 - myStats.completionTime) / 1000) * PVP_CONSTANTS.TIME_BONUS_POINTS)}
                  </span>
                </div>
                <div className="border-t border-white/20 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-white font-bold">Total Score:</span>
                    <span className="text-yellow-400 font-bold text-xl">{myStats.score}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Opponent Stats */}
            <div className={`rounded-xl p-6 ${!isWinner && !isDraw ? 'bg-red-500/20 border-2 border-red-400' : 'bg-gray-700/30'}`}>
              <h3 className="text-lg font-bold text-white mb-4">{opponentStats.username}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Soldiers:</span>
                  <span className="text-white font-bold">{opponentStats.soldiers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Time:</span>
                  <span className="text-white font-bold">{(opponentStats.completionTime / 1000).toFixed(1)}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Soldier Points:</span>
                  <span className="text-white font-bold">{opponentStats.soldiers * PVP_CONSTANTS.SOLDIER_POINTS}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Time Bonus:</span>
                  <span className="text-white font-bold">
                    {Math.floor(((150000 - opponentStats.completionTime) / 1000) * PVP_CONSTANTS.TIME_BONUS_POINTS)}
                  </span>
                </div>
                <div className="border-t border-white/20 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-white font-bold">Total Score:</span>
                    <span className="text-yellow-400 font-bold text-xl">{opponentStats.score}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Rewards */}
        {showRewards && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-lg rounded-2xl p-6 mb-6 border-2 border-yellow-400/30"
          >
            <h2 className="text-2xl font-bold text-white text-center mb-4">Rewards</h2>
            <div className="flex justify-center gap-8">
              <motion.div
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <div className="text-5xl mb-2">🪙</div>
                <div className="text-3xl font-bold text-yellow-400">
                  {isWinner ? `+${winnerCoins}` : '-1,000'}
                </div>
                <div className="text-sm text-gray-300">Coins</div>
              </motion.div>

              <motion.div
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center"
              >
                <div className="text-5xl mb-2">💎</div>
                <div className="text-3xl font-bold text-cyan-400">
                  +{isWinner ? PVP_CONSTANTS.WINNER_GEMS : PVP_CONSTANTS.LOSER_GEMS}
                </div>
                <div className="text-sm text-gray-300">Gems</div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate('/pvp/lobby')}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-8 rounded-xl transition-all transform hover:scale-105"
          >
            Play Again
          </button>
          <button
            onClick={() => navigate('/')}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-xl transition-all"
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}

export default PvPResultsScreen;
