import { useState, useEffect } from 'react';
import { CardWithDetails, useCards } from '@/context/CardContext';
import { CARD_STAT_DISPLAY } from '@shared/interface/ICard';
import { useAuth } from '@/hooks/useAuth';
import { getCardImage } from './config';
import CardStars from './CardStars';
import TextWithShadow from '@/components/TextWithShadow';
import ButtonSpinner from '@/components/ui/ButtonSpinner';
import { formatNumber } from '@/lib/utils';
import { ModalTransition } from '@/components/animation';

interface CardDetailProps {
  card: CardWithDetails | null;
  onClose: () => void;
}

export default function CardDetail({ card: initialCard, onClose }: CardDetailProps) {
  const { user, refreshUser } = useAuth();
  const { upgradeCard, refreshCards, cards } = useCards();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Get the latest card data from context
  const card = initialCard ? (cards.find(c => c.cardId === initialCard.cardId) || initialCard) : null;

  const statInfo = card ? CARD_STAT_DISPLAY[card.type] : null;
  const isMaxLevel = card ? card.starLevel >= 3 : false;
  const canAffordUpgrade = card?.upgradeCost
    ? (user?.coins || 0) >= card.upgradeCost.coins && (user?.gems || 0) >= card.upgradeCost.gems
    : false;

  // Reset states when card changes
  useEffect(() => {
    setError(null);
    setShowSuccess(false);
  }, [initialCard?.cardId]);

  const handleUpgrade = async () => {
    if (!card || isMaxLevel || !canAffordUpgrade || isUpgrading) return;

    setIsUpgrading(true);
    setError(null);
    try {
      const success = await upgradeCard(card.cardId);
      if (success) {
        await Promise.all([refreshCards(), refreshUser()]);
        setShowSuccess(true);
      } else {
        setError('Failed to upgrade card');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upgrade card');
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <ModalTransition
      isOpen={!!card}
      onClose={onClose}
      contentClassName="w-full max-w-xs p-4"
    >
      {card && statInfo && (
        <>
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-8 right-6 z-20 w-8 h-8 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
          >
            <img
              src="/ui/close.png"
              alt="Close"
              className="w-6 h-6 drop-shadow-lg"
            />
          </button>

          {/* Card Image */}
          <div className="relative">
            <img
              src={getCardImage(card.type, card.rarity)}
              alt={card.name}
              className="w-full h-auto rounded-2xl shadow-2xl"
            />

            {/* Overlay Content */}
            <div className="absolute inset-0 flex flex-col justify-between p-4 rounded-2xl">
              {/* Top Section - Name */}
              <div className="text-center mt-5">
                <div className="inline-block py-1 px-4 rounded-2xl bg-black/10">
                  <TextWithShadow as="h2" className="text-2xl font-bold text-white">
                    {card.name}
                  </TextWithShadow>
                </div>
              </div>

              {/* Bottom Section - Stars, Bonus, Upgrade */}
              <div className="space-y-3">
                {/* Stars */}
                <div className="flex justify-center">
                  <CardStars starLevel={card.starLevel} />
                </div>

                {/* Current Bonus */}
                <div className="text-center py-2 px-3 rounded-xl bg-black/50">
                  <TextWithShadow as="span" className="text-lg font-bold text-white">
                    +{card.currentBonusPercent}%
                  </TextWithShadow>
                  <TextWithShadow as="span" className="text-sm ml-2" style={{ color: statInfo.color }}>
                    {statInfo.name}
                  </TextWithShadow>
                </div>

                {/* Upgrade Section */}
                {isMaxLevel ? (
                  <div className="text-center py-3 rounded-xl bg-gradient-to-r from-yellow-500/30 to-amber-500/30">
                    <TextWithShadow as="span" className="text-yellow-400 font-bold text-lg">
                      MAX LEVEL
                    </TextWithShadow>
                  </div>
                ) : card.upgradeCost ? (
                  <div className="space-y-2">
                    {/* Upgrade Button with Price */}
                    <button
                      onClick={handleUpgrade}
                      disabled={!canAffordUpgrade || isUpgrading}
                      className={`w-full flex items-center justify-center gap-3
                        active:scale-95 transition-transform bg-no-repeat bg-center
                        ${!canAffordUpgrade ? 'opacity-70' : ''}`}
                      style={{
                        backgroundImage: canAffordUpgrade
                          ? "url('/ui/button/green.png')"
                          : "url('/ui/button/gray.png')",
                        backgroundSize: 'contain',
                        backgroundPosition: 'center',
                        aspectRatio: '280/70',
                      }}
                    >
                      {isUpgrading ? (
                        <ButtonSpinner size="small" />
                      ) : (
                        <>
                          {/* Coins */}
                          <div className="flex items-center gap-1">
                            <img src="/ui/coin.png" alt="coins" className="w-5 h-5" />
                            <TextWithShadow
                              as="span"
                              className={`font-bold ${user && user.coins >= card.upgradeCost.coins ? 'text-white' : 'text-red-400'}`}
                            >
                              {formatNumber(card.upgradeCost.coins)}
                            </TextWithShadow>
                          </div>

                          {/* Separator */}
                          <TextWithShadow as="span" className="text-white/50">|</TextWithShadow>

                          {/* Gems */}
                          <div className="flex items-center gap-1">
                            <img src="/ui/gem.png" alt="gems" className="w-5 h-5" />
                            <TextWithShadow
                              as="span"
                              className={`font-bold ${user && user.gems >= card.upgradeCost.gems ? 'text-white' : 'text-red-400'}`}
                            >
                              {formatNumber(card.upgradeCost.gems)}
                            </TextWithShadow>
                          </div>
                        </>
                      )}
                    </button>

                    {/* Next Star Preview */}
                    <div className="text-center py-1">
                      <TextWithShadow as="span" className="text-sm text-gray-300">
                        Next: +{card.nextStarBonusPercent}% {statInfo.name}
                      </TextWithShadow>
                    </div>
                  </div>
                ) : null}

                {error && (
                  <div className="text-center py-2 px-3 rounded-xl bg-red-500/30">
                    <TextWithShadow as="span" className="text-red-400 text-sm">
                      {error}
                    </TextWithShadow>
                  </div>
                )}
              </div>
            </div>

            {/* Success Animation */}
            {showSuccess && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                <div className="text-center">
                  <div className="text-6xl mb-2">⭐</div>
                  <TextWithShadow as="span" className="text-2xl font-bold text-yellow-400">
                    Upgraded!
                  </TextWithShadow>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </ModalTransition>
  );
}
