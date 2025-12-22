import { motion } from 'framer-motion';
import { ChestTier, CHEST_TIER_COLORS } from '@shared/interface/IChest';
import { CARD_RARITY_COLORS, CARD_STAT_DISPLAY, CardRarity, CardType } from '@shared/interface/ICard';
import { useCards } from '@/context/CardContext';
import { useEffect } from 'react';

interface ChestRewardDisplayProps {
  tier: ChestTier;
  rewards: {
    cards: Array<{
      cardId: string;
      rarity: CardRarity;
      isDuplicate: boolean;
      conversionReward?: { coins: number; gems: number };
    }>;
    coins: number;
    gems: number;
  };
  onClose: () => void;
}

export default function ChestRewardDisplay({ tier, rewards, onClose }: ChestRewardDisplayProps) {
  const tierColor = CHEST_TIER_COLORS[tier];
  const { refreshCards } = useCards();

  // Refresh cards after getting rewards
  useEffect(() => {
    refreshCards();
  }, [refreshCards]);

  // Parse card type from cardId (e.g., "speed_rare_01" -> "speed")
  const getCardType = (cardId: string): CardType => {
    const parts = cardId.split('_');
    return parts[0] as CardType;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.5, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.5, y: 50 }}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: `linear-gradient(180deg, ${tierColor}30, #1a1a2e)`,
          border: `3px solid ${tierColor}`
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center p-6 pb-4">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="text-6xl mb-3"
          >
            {tier === 'gold' ? '🏆' : tier === 'silver' ? '🎁' : '📦'}
          </motion.div>
          <h2
            className="text-2xl font-bold uppercase"
            style={{ color: tierColor }}
          >
            {tier} Chest Opened!
          </h2>
        </div>

        {/* Cards */}
        <div className="px-4 pb-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Cards Received</h3>
          <div className="space-y-2">
            {rewards.cards.map((card, index) => {
              const rarityColor = CARD_RARITY_COLORS[card.rarity];
              const cardType = getCardType(card.cardId);
              const statInfo = CARD_STAT_DISPLAY[cardType];

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${rarityColor}20, transparent)`,
                    border: `1px solid ${rarityColor}40`
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Card Type Icon */}
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${statInfo.color}30` }}
                    >
                      {cardType === 'speed' && '⚡'}
                      {cardType === 'jump' && '🦘'}
                      {cardType === 'income' && '💰'}
                      {cardType === 'power' && '🔫'}
                      {cardType === 'magnet' && '🧲'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-bold uppercase px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: rarityColor, color: '#000' }}
                        >
                          {card.rarity}
                        </span>
                        <span className="text-white font-medium">{statInfo.name}</span>
                      </div>
                      {card.isDuplicate && card.conversionReward && (
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                          <span>Duplicate converted:</span>
                          <span className="text-yellow-400">+{card.conversionReward.coins} 🪙</span>
                          {card.conversionReward.gems > 0 && (
                            <span className="text-purple-400">+{card.conversionReward.gems} 💎</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {card.isDuplicate ? (
                    <span className="text-xs text-gray-500 px-2 py-1 bg-gray-800 rounded">DUP</span>
                  ) : (
                    <span className="text-xs text-green-400 px-2 py-1 bg-green-900/30 rounded">NEW!</span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Currency Rewards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="px-4 pb-4"
        >
          <div className="flex justify-center gap-6 p-4 bg-gray-900/50 rounded-xl">
            {rewards.coins > 0 && (
              <div className="text-center">
                <div className="text-2xl mb-1">🪙</div>
                <div className="text-xl font-bold text-yellow-400">+{rewards.coins.toLocaleString()}</div>
                <div className="text-xs text-gray-400">Coins</div>
              </div>
            )}
            {rewards.gems > 0 && (
              <div className="text-center">
                <div className="text-2xl mb-1">💎</div>
                <div className="text-xl font-bold text-purple-400">+{rewards.gems.toLocaleString()}</div>
                <div className="text-xs text-gray-400">Gems</div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Close Button */}
        <div className="p-4 pt-0">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            onClick={onClose}
            className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all"
          >
            Awesome!
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
