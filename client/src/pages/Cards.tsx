import { useState, useMemo } from 'react';
import { useCards, CardWithDetails } from '@/context/CardContext';
import { useAuth } from '@/hooks/useAuth';
import { CardType } from '@shared/interface/ICard';
import CardDetail from '@/components/cards/CardDetail';
import CardsHeader from '@/components/cards/CardsHeader';
import CardBonuses from '@/components/cards/CardBonuses';
import CardFilters from '@/components/cards/CardFilters';
import CardsGrid from '@/components/cards/CardsGrid';
import PageReveal, { StaggerContainer, StaggerItem } from '@/components/ui/PageReveal';
import { CLIENT_CONSTANTS } from '@/utils/constants';

type FilterType = 'all' | CardType;

export default function Cards() {
  const { user } = useAuth();
  const { cards, bonusesPercent, powerContribution, totalCards, isLoading } = useCards();
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedCard, setSelectedCard] = useState<CardWithDetails | null>(null);

  // Filter and sort cards
  const filteredCards = useMemo(() => {
    let result = [...cards];
    // Apply filter
    if (filterType !== 'all') {
      result = result.filter(card => card.type === filterType);
    }

    return result;
  }, [cards, filterType]);

  if (!user) return null;
  
  return (
    <PageReveal className="absolute inset-0 flex flex-col overflow-hidden">
      {/* Fixed background that covers entire screen */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: `url(${CLIENT_CONSTANTS.CARDS_BACKGROUND_IMAGE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <StaggerContainer className="flex-1 flex flex-col overflow-hidden pb-24 mt-10">
        {/* Header */}
        <StaggerItem>
          <CardsHeader totalCards={totalCards} powerContribution={powerContribution} />
        </StaggerItem>

        {/* Bonuses Summary */}
        <StaggerItem>
          <CardBonuses bonusesPercent={bonusesPercent} />
        </StaggerItem>

        {/* Filters & Sort */}
        <StaggerItem>
          <CardFilters filterType={filterType} onFilterChange={setFilterType} />
        </StaggerItem>

        {/* Cards Grid - Scrollable */}
        <StaggerItem className="flex-1 overflow-y-auto min-h-0">
          <CardsGrid
            cards={filteredCards}
            isLoading={isLoading}
            filterType={filterType}
            onCardSelect={setSelectedCard}
          />
        </StaggerItem>

        {/* Card Detail Modal */}
        <CardDetail
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      </StaggerContainer>
    </PageReveal>
  );
}
