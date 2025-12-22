import { CardType, CARD_STAT_DISPLAY } from '@shared/interface/ICard';
import TextWithShadow from '@/components/TextWithShadow';

interface CardFiltersProps {
  filterType: 'all' | CardType;
  onFilterChange: (type: 'all' | CardType) => void;
}

export default function CardFilters({ filterType, onFilterChange }: CardFiltersProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-2">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => onFilterChange('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <TextWithShadow as="span">All</TextWithShadow>
          </button>
          {(Object.keys(CARD_STAT_DISPLAY) as CardType[]).map(type => (
            <button
              key={type}
              onClick={() => onFilterChange(type)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterType === type
                  ? 'text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
              style={filterType === type ? { backgroundColor: CARD_STAT_DISPLAY[type].color } : {}}
            >
              <TextWithShadow as="span">
                {CARD_STAT_DISPLAY[type].name}
              </TextWithShadow>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
