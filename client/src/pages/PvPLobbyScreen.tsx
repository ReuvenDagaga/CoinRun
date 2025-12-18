/**
 * PvP Lobby Screen - Pre-game matchmaking and lobby
 * Shows matched players and countdown before game starts
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import {
  joinMatchmaking,
  cancelMatchmaking,
  onMatchmakingSearching,
  onMatchFound,
  onMatchmakingTimeout,
  onMatchmakingCanceled,
  getPvPSocket
} from '../services/pvpSocket';
import { MatchFoundPayload, PVP_CONSTANTS } from '../../../shared/types/pvp.types';

export function PvPLobbyScreen() {
  const navigate = useNavigate();
  const { user, powerLevel: userPowerLevel } = useAuth();

  const [status, setStatus] = useState<'idle' | 'searching' | 'found' | 'countdown'>('idle');
  const [powerLevel, setPowerLevel] = useState<number>(0);
  const [matchData, setMatchData] = useState<{
    player1: MatchFoundPayload;
    player2: MatchFoundPayload;
  } | null>(null);
  const [countdown, setCountdown] = useState<number>(3);
  const [searchTime, setSearchTime] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Initialize socket connection on mount
  useEffect(() => {
    getPvPSocket(); // Ensure socket is connected
    console.log('[Lobby] PvP socket initialized');
  }, []);

  // Handle matchmaking
  useEffect(() => {
    const unsubSearching = onMatchmakingSearching((data) => {
      console.log('[Lobby] Searching...', data);
      setStatus('searching');
      setPowerLevel(data.powerLevel);
      setError(null);
    });

    const unsubFound = onMatchFound((data) => {
      console.log('[Lobby] Match found!', data);
      setStatus('found');
      setMatchData(data);

      // Start countdown after 2 seconds (show match info)
      setTimeout(() => {
        setStatus('countdown');
        startCountdown(data);
      }, 2000);
    });

    const unsubTimeout = onMatchmakingTimeout(() => {
      console.log('[Lobby] Matchmaking timeout');
      setStatus('idle');
      setError('No match found after 60 seconds. Please try again.');
    });

    const unsubCanceled = onMatchmakingCanceled(() => {
      console.log('[Lobby] Matchmaking canceled');
      setStatus('idle');
    });

    return () => {
      unsubSearching();
      unsubFound();
      unsubTimeout();
      unsubCanceled();
    };
  }, []);

  // Search timer
  useEffect(() => {
    if (status !== 'searching') return;

    const interval = setInterval(() => {
      setSearchTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  // Countdown timer
  const startCountdown = (data: any) => {
    let count = 3;
    setCountdown(count);

    const interval = setInterval(() => {
      count -= 1;
      setCountdown(count);

      if (count === 0) {
        clearInterval(interval);
        // Store match data in session storage for PvPGameScreen
        const roomId = data.player1.roomId;
        sessionStorage.setItem(`pvp_match_${roomId}`, JSON.stringify(data));
        // Navigate to game
        navigate(`/pvp/game/${roomId}`);
      }
    }, 1000);
  };

  const handleJoinQueue = () => {
    if (!user) {
      setError('Please log in to play PvP');
      return;
    }

    // Check if user has enough coins
    if (user.coins < PVP_CONSTANTS.ENTRY_FEE) {
      setError(`You need ${PVP_CONSTANTS.ENTRY_FEE.toLocaleString()} coins to play. You have ${user.coins.toLocaleString()} coins.`);
      return;
    }

    setError(null);
    setSearchTime(0);
    joinMatchmaking();
  };

  const handleCancelQueue = () => {
    cancelMatchmaking();
  };

  const handleBack = () => {
    if (status === 'searching') {
      cancelMatchmaking();
    }
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">1v1 PvP</h1>
          <p className="text-blue-200">Compete against other players for coins and glory!</p>
        </div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {/* Idle State */}
          {status === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center"
            >
              <div className="mb-6">
                <div className="text-6xl mb-4">⚔️</div>
                <h2 className="text-2xl font-bold text-white mb-2">Ready to Battle?</h2>
                <p className="text-blue-200">Entry Fee: {PVP_CONSTANTS.ENTRY_FEE.toLocaleString()} coins</p>
                <p className="text-green-300 text-lg mt-2">
                  Winner takes: {Math.floor(PVP_CONSTANTS.ENTRY_FEE * PVP_CONSTANTS.WINNER_MULTIPLIER).toLocaleString()} coins + {PVP_CONSTANTS.WINNER_GEMS} gems
                </p>
                {user && (
                  <p className="text-gray-300 text-sm mt-2">Your balance: {user.coins.toLocaleString()} coins | Power Level: {userPowerLevel}</p>
                )}
                {error && (
                  <div className="mt-4 bg-red-900/30 border border-red-500/50 rounded-lg px-4 py-3">
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                )}
              </div>

              <button
                onClick={handleJoinQueue}
                disabled={!user || user.coins < PVP_CONSTANTS.ENTRY_FEE}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-xl py-4 px-12 rounded-xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Find Match
              </button>

              <button
                onClick={handleBack}
                className="mt-4 block mx-auto text-blue-200 hover:text-white transition-colors"
              >
                ← Back to Menu
              </button>
            </motion.div>
          )}

          {/* Searching State */}
          {status === 'searching' && (
            <motion.div
              key="searching"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center"
            >
              <div className="mb-6">
                <div className="text-6xl mb-4 animate-pulse">🔍</div>
                <h2 className="text-2xl font-bold text-white mb-2">Searching for Opponent...</h2>
                <p className="text-blue-200">Power Level: {powerLevel}</p>
                <p className="text-gray-300 mt-2">{searchTime}s {searchTime >= 30 && '(Expanding search range...)'}</p>
              </div>

              {/* Animated searching indicator */}
              <div className="flex justify-center gap-2 mb-6">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>

              <button
                onClick={handleCancelQueue}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-xl transition-all"
              >
                Cancel
              </button>
            </motion.div>
          )}

          {/* Match Found State */}
          {(status === 'found' || status === 'countdown') && matchData && (
            <motion.div
              key="found"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8"
            >
              <h2 className="text-3xl font-bold text-center text-white mb-8">Match Found!</h2>

              {/* Player Cards */}
              <div className="flex items-center justify-between gap-8 mb-8">
                {/* Player 1 (You) */}
                <div className="flex-1 bg-blue-500/20 rounded-xl p-6 text-center">
                  <div className="text-4xl mb-3">👤</div>
                  <h3 className="text-xl font-bold text-white mb-1">You</h3>
                  <p className="text-blue-200 text-sm">
                    Power: {userPowerLevel}
                  </p>
                </div>

                {/* VS */}
                <div className="text-4xl font-bold text-white">VS</div>

                {/* Player 2 (Opponent) */}
                <div className="flex-1 bg-red-500/20 rounded-xl p-6 text-center">
                  <div className="text-4xl mb-3">👤</div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    {matchData.player1.opponent.username}
                  </h3>
                  <p className="text-red-200 text-sm">
                    Power: {matchData.player1.opponent.powerLevel}
                  </p>
                </div>
              </div>

              {/* Countdown */}
              {status === 'countdown' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-center"
                >
                  <div className="text-8xl font-bold text-white mb-4">
                    {countdown > 0 ? countdown : 'GO!'}
                  </div>
                  <p className="text-blue-200">Get ready to race!</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default PvPLobbyScreen;
