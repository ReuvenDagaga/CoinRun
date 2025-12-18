/**
 * PvP Results Screen - Shows match results and rewards
 * Displays winner, scores, and distributes rewards
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PVP_CONSTANTS } from '../../../shared/types/pvp.types';
import { useAuth } from '@/hooks/useAuth';

interface GameResult {
  roomId: string;
  winnerId: string | null;
  player1: {
    userId: string;
    soldiers: number;
    completionTime: number;
    isAlive: boolean;
  };
  player2: {
    userId: string;
    soldiers: number;
    completionTime: number;
    isAlive: boolean;
  };
  reason: string;
}

export function PvPResultsScreen() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const { user } = useAuth();
  const [result, setResult] = useState<GameResult | null>(null);
  const [showRewards, setShowRewards] = useState(false);
  const [player1Name, setPlayer1Name] = useState('Player 1');
  const [player2Name, setPlayer2Name] = useState('Player 2');

  // Get result from session storage (set by PvPGameScreen when game:finished is received)
  useEffect(() => {
    const resultStr = sessionStorage.getItem(`pvp_result_${roomId}`);
    if (resultStr) {
      try {
        const gameResult = JSON.parse(resultStr) as GameResult;
        setResult(gameResult);

        // Get player names from match data
        const matchDataStr = sessionStorage.getItem(`pvp_match_${roomId}`);
        if (matchDataStr) {
          const matchData = JSON.parse(matchDataStr);
          // Determine names based on user ID
          const isPlayer1 = matchData.player1.opponent.userId !== user?._id;
          if (isPlayer1) {
            setPlayer1Name('You');
            setPlayer2Name(matchData.player1.opponent.username);
          } else {
            setPlayer1Name(matchData.player2.opponent.username);
            setPlayer2Name('You');
          }
        }

        // Show rewards after 2 seconds
        setTimeout(() => {
          setShowRewards(true);
        }, 2500);

        // Clear session storage after loading
        sessionStorage.removeItem(`pvp_result_${roomId}`);
      } catch (e) {
        console.error('[Results] Failed to parse result data:', e);
      }
    }
  }, [roomId, user]);

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-2xl">Calculating results...</div>
      </div>
    );
  }

  const isWinner = result.winnerId === user?._id;
  const isDraw = result.winnerId === null;

  // Calculate scores based on PvP formula
  const maxTime = 150; // seconds
  const score1 = (result.player1.soldiers * PVP_CONSTANTS.SOLDIER_POINTS) +
                  ((maxTime * 1000 - result.player1.completionTime) / 1000 * PVP_CONSTANTS.TIME_BONUS_POINTS);
  const score2 = (result.player2.soldiers * PVP_CONSTANTS.SOLDIER_POINTS) +
                  ((maxTime * 1000 - result.player2.completionTime) / 1000 * PVP_CONSTANTS.TIME_BONUS_POINTS);

  const myStats = result.player1.userId === user?._id
    ? { ...result.player1, username: player1Name, score: score1 }
    : { ...result.player2, username: player2Name, score: score2 };

  const opponentStats = result.player1.userId === user?._id
    ? { ...result.player2, username: player2Name, score: score2 }
    : { ...result.player1, username: player1Name, score: score1 };

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
