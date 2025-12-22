import TextWithShadow from '@/components/TextWithShadow';
import ChestTimer from '@/components/chests/ChestTimer';
import { COLORS } from '@/utils/constants';

interface CardsHeaderProps {
  totalCards: number;
  powerContribution: number;
}

export default function CardsHeader({ totalCards, powerContribution }: CardsHeaderProps) {
  return (
    <div className="sticky top-0 z-40 border-b border-purple-400/20">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <TextWithShadow as="h1" className="text-2xl font-bold text-white">
              My Cards
            </TextWithShadow>
            <p className="text-sm">
              <TextWithShadow as="span" style={{ color: COLORS.WARNING }}>
                {totalCards} cards
              </TextWithShadow>
              <TextWithShadow as="span" className="text-gray-400 mx-1">
                |
              </TextWithShadow>
              <TextWithShadow as="span" style={{ color: COLORS.SECONDARY }}>
                +{powerContribution} Power
              </TextWithShadow>
            </p>
          </div>
          <ChestTimer />
        </div>
      </div>
    </div>
  );
}
