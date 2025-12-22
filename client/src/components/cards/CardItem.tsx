import { CardWithDetails } from '@/context/CardContext';
import { CARD_STAT_DISPLAY } from '@shared/interface/ICard';
import { getCardImage } from './config';
import { PressAnimation } from '@/components/animation/PressAnimation';
import TextWithShadow from '@/components/TextWithShadow';
import CardStars from './CardStars';
import UpgradeIndicator from './UpgradeIndicator';

interface CardItemProps {
  card: CardWithDetails;
  onClick: () => void;
}

export default function CardItem({ card, onClick }: CardItemProps) {
  const statInfo = CARD_STAT_DISPLAY[card.type];

  return (
    <PressAnimation scaleAmount={0.95}>
      <button onClick={onClick} className="w-full relative">
        {/* Card Image - Full card */}
        <img
          src={getCardImage(card.type, card.rarity)}
          alt={card.name}
          className="w-full h-auto rounded-xl"
        />

        {/* Card Name - Top */}
        <div className="absolute top-4 left-4 right-4">
          <div className="text-center py-1 px-2 rounded-2xl bg-black/30">
            <TextWithShadow as="span" className="text-white font-bold text-sm truncate">
              {card.name}
            </TextWithShadow>
          </div>
        </div>

        {/* Overlay content - Bottom */}
        <div className="absolute bottom-4 left-2 right-2">
          {/* Stars */}
          <div className="mb-1">
            <CardStars starLevel={card.starLevel} />
          </div>

          {/* Bonus */}
          <div className="absolute bottom-8 left-4 right-4 text-center py-1 rounded-xl bg-black/40">
            <TextWithShadow as="span" className="text-white font-bold">
              +{card.currentBonusPercent}%
            </TextWithShadow>
            <TextWithShadow as="span" className="text-xs ml-1" style={{ color: statInfo.color }}>
              {statInfo.name}
            </TextWithShadow>
          </div>
        </div>

        {/* Upgrade indicator */}
        {card.canUpgrade && (
          <div className="absolute top-6 right-3">
            <UpgradeIndicator />
          </div>
        )}
      </button>
    </PressAnimation>
  );
}
