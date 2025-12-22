import TextWithShadow from '@/components/TextWithShadow';

interface EmptyCardsStateProps {
  filterType: string;
  filterName?: string;
}

export default function EmptyCardsState({ filterType, filterName }: EmptyCardsStateProps) {
  return (
    <div className="text-center py-12">
      <img
        src="/ui/Cards.Png"
        alt="Cards"
        className="w-48 h-48 mx-auto mb-4"
      />
      <TextWithShadow as="h3" className="text-xl font-bold text-white mb-2">
        No Cards Yet
      </TextWithShadow>
      <TextWithShadow as="p" className="text-gray-200">
        {filterType === 'all'
          ? 'Open chests to collect cards!'
          : `No ${filterName} cards yet`}
      </TextWithShadow>
    </div>
  );
}
