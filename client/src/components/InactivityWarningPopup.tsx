/**
 * Inactivity Warning Popup - Shows when player is inactive for 30 seconds
 * Gives 10 seconds to confirm activity or be disconnected
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface InactivityWarningPopupProps {
  isVisible: boolean;
  secondsRemaining: number;
  onConfirm: () => void;
}

export function InactivityWarningPopup({ isVisible, secondsRemaining, onConfirm }: InactivityWarningPopupProps) {
  const [countdown, setCountdown] = useState(secondsRemaining);

  useEffect(() => {
    if (!isVisible) {
      setCountdown(secondsRemaining);
      return;
    }

    setCountdown(secondsRemaining);

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, secondsRemaining]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999]"
        >
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            className="bg-gradient-to-br from-red-900 to-orange-900 rounded-2xl p-8 max-w-md mx-4 border-4 border-red-500 shadow-2xl"
          >
            <div className="text-center">
              {/* Warning Icon */}
              <div className="text-8xl mb-4 animate-bounce">⚠️</div>

              {/* Title */}
              <h2 className="text-3xl font-bold text-white mb-4">
                Are You Still There?
              </h2>

              {/* Message */}
              <p className="text-xl text-red-100 mb-6">
                You've been inactive for 30 seconds. Click the button to continue playing!
              </p>

              {/* Countdown */}
              <div className="mb-6">
                <div className="text-6xl font-bold text-yellow-400 mb-2 animate-pulse">
                  {countdown}
                </div>
                <p className="text-red-200 text-sm">
                  seconds remaining
                </p>
              </div>

              {/* Confirm Button */}
              <button
                onClick={onConfirm}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-2xl py-4 px-12 rounded-xl transition-all transform hover:scale-105 shadow-lg w-full"
              >
                I'm Here! ✋
              </button>

              {/* Warning Text */}
              <p className="text-red-300 text-sm mt-4">
                If you don't respond, your opponent will win by forfeit!
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default InactivityWarningPopup;
