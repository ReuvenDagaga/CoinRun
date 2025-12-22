import { CardType, CARD_STAT_DISPLAY } from '@shared/interface/ICard';
import TextWithShadow from '@/components/TextWithShadow';
import { CARD_TYPE_IMAGES } from './config';

interface CardBonusesProps {
  bonusesPercent: Record<CardType, number>;
}


export default function CardBonuses({ bonusesPercent }: CardBonusesProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      <div className="bg-gray-800/50 rounded-xl p-4 border border-purple-500/20">
        <TextWithShadow as="h2" className="text-md font-semibold text-gray-300 mb-3">
          Card Bonuses
        </TextWithShadow>
        <div className="grid grid-cols-5 gap-2">
          {(Object.keys(CARD_STAT_DISPLAY) as CardType[]).map(type => (
            <div
              key={type}
              className="text-center p-2 rounded-lg aspect-square flex flex-col items-center justify-center"
              style={{
                backgroundImage: `url(${CARD_TYPE_IMAGES[type]})`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            >
              <TextWithShadow
                as="span"
                className="text-xl font-bold block"
                style={{ color: CARD_STAT_DISPLAY[type].color }}
              >
                +{bonusesPercent[type] || 0}%
              </TextWithShadow>
              <TextWithShadow as="span" className="text-md text-gray-300 block">
                {CARD_STAT_DISPLAY[type].name}
              </TextWithShadow>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
