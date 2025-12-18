/**
 * Disconnection Overlay - Shows when opponent disconnects
 * Displays waiting message and countdown before forfeit
 */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PVP_CONSTANTS } from '../../../shared/types/pvp.types';

interface DisconnectionOverlayProps {
  isVisible: boolean;
  disconnectedPlayer: string;
  onReconnect?: () => void;
  onForfeit?: () => void;
}

export function DisconnectionOverlay({
  isVisible,
  disconnectedPlayer,
  onReconnect,
  onForfeit
}: DisconnectionOverlayProps) {
  const [countdown, setCountdown] = useState(PVP_CONSTANTS.RECONNECT_TIMEOUT / 1000);

  useEffect(() => {
    if (!isVisible) {
      setCountdown(PVP_CONSTANTS.RECONNECT_TIMEOUT / 1000);
      return;
    }

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onForfeit?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, onForfeit]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-yellow-500/30"
      >
        {/* Icon */}
        <div className="text-center mb-6">
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
            className="text-6xl mb-4"
          >
            ⚠️
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Opponent Disconnected</h2>
          <p className="text-gray-300">
            {disconnectedPlayer} has lost connection
          </p>
        </div>

        {/* Countdown */}
        <div className="bg-gray-700/50 rounded-xl p-6 mb-6">
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-2">Waiting for reconnection...</p>
            <div className="text-5xl font-bold text-yellow-400 mb-2">
              {countdown}
            </div>
            <p className="text-gray-400 text-xs">
              seconds until forfeit
            </p>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-2 bg-gray-600 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: PVP_CONSTANTS.RECONNECT_TIMEOUT / 1000, ease: 'linear' }}
            />
          </div>
        </div>

        {/* Info */}
        <div className="text-center text-sm text-gray-400">
          <p>• Game is paused</p>
          <p>• You will win by forfeit if they don't reconnect</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Reconnection Overlay - Shows when opponent reconnects
 */
export function ReconnectionOverlay({ countdown }: { countdown: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        className="bg-gradient-to-br from-green-800 to-green-900 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
      >
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-white mb-2">Opponent Reconnected!</h2>
          <p className="text-green-200 mb-6">Resuming in...</p>
          <div className="text-7xl font-bold text-white">
            {countdown}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default DisconnectionOverlay;
