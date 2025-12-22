import { CardWithDetails } from '@/context/CardContext';
import CardItem from './CardItem';
import { AnimatedList } from '@/components/animation/AnimatedList';

interface CardsGridContentProps {
  cards: CardWithDetails[];
  onCardSelect: (card: CardWithDetails) => void;
}

export default function CardsGridContent({ cards, onCardSelect }: CardsGridContentProps) {
  return (
    <AnimatedList
      items={cards}
      keyExtractor={(card) => card.cardId}
      className="grid grid-cols-2 gap-3"
      staggerDelay={0.05}
      renderItem={(card) => (
        <CardItem
          card={card}
          onClick={() => onCardSelect(card)}
        />
      )}
    />
  );
}
