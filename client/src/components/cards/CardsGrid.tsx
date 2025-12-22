import { CardWithDetails } from '@/context/CardContext';
import { CardType, CARD_STAT_DISPLAY } from '@shared/interface/ICard';
import EmptyCardsState from './EmptyCardsState';
import CardsGridContent from './CardsGridContent';
import Loading from '../ui/Loading';

interface CardsGridProps {
  cards: CardWithDetails[];
  isLoading: boolean;
  filterType: 'all' | CardType;
  onCardSelect: (card: CardWithDetails) => void;
}

export default function CardsGrid({
  cards,
  isLoading,
  filterType,
  onCardSelect,
}: CardsGridProps) {

  if (isLoading) return <Loading />;

  if (cards.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-4">
        <EmptyCardsState
          filterType={filterType}
          filterName={filterType !== 'all' ? CARD_STAT_DISPLAY[filterType].name : undefined}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      <CardsGridContent cards={cards} onCardSelect={onCardSelect} />
    </div>
  );
}
