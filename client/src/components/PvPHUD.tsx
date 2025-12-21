/**
 * PvP HUD - In-game overlay showing match information
 * Displays soldier counts, timer, progress, and connection status
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PvPHUDProps {
  yourSoldiers: number;
  opponentSoldiers: number;
  yourProgress: number;  // 0-1
  opponentProgress: number;  // 0-1
  gameTime: number;  // milliseconds
  maxTime: number;  // seconds
  opponentName: string;
  connectionQuality?: 'good' | 'medium' | 'poor';
}

export function PvPHUD({
  yourSoldiers,
  opponentSoldiers,
  yourProgress,
  opponentProgress,
  gameTime,
  maxTime,
  opponentName,
  connectionQuality = 'good'
}: PvPHUDProps) {
  const [prevYourSoldiers, setPrevYourSoldiers] = useState(yourSoldiers);
  const [prevOppSoldiers, setPrevOppSoldiers] = useState(opponentSoldiers);

  // Animate soldier count changes
  useEffect(() => {
    setPrevYourSoldiers(yourSoldiers);
  }, [yourSoldiers]);

  useEffect(() => {
    setPrevOppSoldiers(opponentSoldiers);
  }, [opponentSoldiers]);

  const timeRemaining = Math.max(0, maxTime - gameTime / 1000);
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = Math.floor(timeRemaining % 60);

  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
        {/* Your Soldier Count (Left) */}
        <motion.div
          className="bg-blue-600/80 backdrop-blur-sm rounded-xl px-6 py-3 shadow-lg pointer-events-auto"
          animate={yourSoldiers !== prevYourSoldiers ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">👥</span>
            <div>
              <div className="text-xs text-blue-200 uppercase ">Your Army</div>
              <div className="text-3xl font-bold text-white">{yourSoldiers}</div>
            </div>
          </div>
        </motion.div>

        {/* Timer (Center) */}
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl px-6 py-3 shadow-lg">
          <div className="text-center">
            <div className="text-xs text-gray-400 uppercase  mb-1">Time</div>
            <div className="text-2xl font-bold text-white font-mono">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Opponent Soldier Count (Right) */}
        <motion.div
          className="bg-red-600/80 backdrop-blur-sm rounded-xl px-6 py-3 shadow-lg pointer-events-auto"
          animate={opponentSoldiers !== prevOppSoldiers ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-red-200 uppercase ">{opponentName}</div>
              <div className="text-2xl font-bold text-white">{opponentSoldiers}</div>
            </div>
            <span className="text-2xl">👥</span>
          </div>
        </motion.div>
      </div>

      {/* Progress Bar (Bottom) */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-3xl px-4">
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-full p-2 shadow-lg">
          <div className="relative h-6 bg-gray-700 rounded-full overflow-hidden">
            {/* Your Progress (Blue) */}
            <motion.div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-blue-400"
              initial={{ width: 0 }}
              animate={{ width: `${yourProgress * 100}%` }}
              transition={{ duration: 0.3 }}
            />

            {/* Opponent Progress (Red, from right) */}
            <motion.div
              className="absolute right-0 top-0 h-full bg-gradient-to-l from-red-500 to-red-400 opacity-60"
              initial={{ width: 0 }}
              animate={{ width: `${opponentProgress * 100}%` }}
              transition={{ duration: 0.3 }}
            />

            {/* Your Indicator */}
            <motion.div
              className="absolute top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white shadow-lg"
              animate={{ left: `${yourProgress * 100}%` }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs text-white font-bold whitespace-nowrap">
                YOU
              </div>
            </motion.div>

            {/* Opponent Indicator */}
            <motion.div
              className="absolute top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white shadow-lg opacity-60"
              animate={{ left: `${opponentProgress * 100}%` }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-white font-bold whitespace-nowrap">
                OPP
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Connection Quality Indicator (Top Right) */}
      <div className="absolute top-20 right-4">
        <div className="flex items-center gap-2 bg-gray-900/60 backdrop-blur-sm rounded-lg px-3 py-2">
          <div className={`w-2 h-2 rounded-full ${
            connectionQuality === 'good' ? 'bg-green-400' :
            connectionQuality === 'medium' ? 'bg-yellow-400' :
            'bg-red-400'
          } animate-pulse`} />
          <span className="text-xs text-white uppercase ">
            {connectionQuality === 'good' ? 'Stable' :
             connectionQuality === 'medium' ? 'Lag' :
             'Poor'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default PvPHUD;
