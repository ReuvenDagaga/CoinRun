import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChestTimer, formatCountdown } from '@/hooks/useChestTimer';
import { useAuth } from '@/hooks/useAuth';
import { CHEST_TIER_COLORS } from '@shared/interface/IChest';
import ChestRewardDisplay from './ChestRewardDisplay';

export default function ChestTimer() {
  const { token } = useAuth();
  const { status, countdown, isReady, isLoading, claimChest } = useChestTimer(token);
  const [showRewards, setShowRewards] = useState(false);
  const [rewards, setRewards] = useState<any>(null);

  const handleClaim = async () => {
    const result = await claimChest();
    if (result) {
      setRewards(result);
      setShowRewards(true);
    }
  };

  if (!status) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg">
        <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-400">Loading...</span>
      </div>
    );
  }

  const tierColor = CHEST_TIER_COLORS[status.tier];

  return (
    <>
      <motion.button
        onClick={isReady ? handleClaim : undefined}
        disabled={isLoading || !isReady}
        className={`relative flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
          isReady
            ? 'cursor-pointer hover:scale-105'
            : 'cursor-default'
        }`}
        style={{
          background: isReady
            ? `linear-gradient(135deg, ${tierColor}40, ${tierColor}20)`
            : 'rgba(31, 41, 55, 0.5)',
          border: `2px solid ${isReady ? tierColor : 'rgba(107, 114, 128, 0.3)'}`
        }}
        whileTap={isReady ? { scale: 0.95 } : {}}
      >
        {/* Chest Icon */}
        <div className="relative">
          <span className="text-2xl">
            {status.tier === 'gold' && '🎁'}
            {status.tier === 'silver' && '📦'}
            {status.tier === 'bronze' && '📦'}
          </span>
          {isReady && (
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
          )}
        </div>

        {/* Timer / Ready Text */}
        <div className="flex flex-col items-start">
          <span
            className="text-xs font-medium uppercase"
            style={{ color: tierColor }}
          >
            {status.tier} Chest
          </span>
          {isReady ? (
            <motion.span
              className="text-sm font-bold text-green-400"
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              {isLoading ? 'Opening...' : 'Tap to Open!'}
            </motion.span>
          ) : (
            <span className="text-sm font-mono text-white">
              {formatCountdown(countdown)}
            </span>
          )}
        </div>

        {/* Pulse animation when ready */}
        {isReady && (
          <motion.div
            className="absolute inset-0 rounded-xl"
            style={{ border: `2px solid ${tierColor}` }}
            animate={{ opacity: [0.5, 0, 0.5], scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
        )}
      </motion.button>

      {/* Rewards Modal */}
      <AnimatePresence>
        {showRewards && rewards && (
          <ChestRewardDisplay
            tier={status.tier}
            rewards={rewards}
            onClose={() => {
              setShowRewards(false);
              setRewards(null);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
