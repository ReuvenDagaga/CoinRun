import { createContext, useState, useContext, useCallback, ReactNode, useMemo, useEffect } from 'react';
import { cardsApi } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { CardType, CardRarity } from '@shared/interface/ICard';

// Card bonuses interface
export interface CardBonuses {
  speed: number;
  jump: number;
  income: number;
  power: number;
  magnet: number;
}

// Card with full details
export interface CardWithDetails {
  id: string;
  cardId: string;
  type: CardType;
  rarity: CardRarity;
  name: string;
  description: string;
  starLevel: number;
  acquiredAt: Date;
  duplicatesConverted: number;
  currentBonus: number;
  currentBonusPercent: number;
  nextStarBonus: number;
  nextStarBonusPercent: number;
  canUpgrade: boolean;
  upgradeCost: { coins: number; gems: number } | null;
  imageUrl: string;
}

interface CardContextValue {
  cards: CardWithDetails[];
  bonuses: CardBonuses;
  bonusesPercent: Record<CardType, number>;
  powerContribution: number;
  totalCards: number;
  isLoading: boolean;
  error: string | null;
  refreshCards: () => Promise<void>;
  upgradeCard: (cardId: string) => Promise<boolean>;
  getCardsByType: (type: CardType) => CardWithDetails[];
  getCardsByRarity: (rarity: CardRarity) => CardWithDetails[];
}

const defaultBonuses: CardBonuses = {
  speed: 0,
  jump: 0,
  income: 0,
  power: 0,
  magnet: 0
};

const CardContext = createContext<CardContextValue | null>(null);

export function CardProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const [cards, setCards] = useState<CardWithDetails[]>([]);
  const [bonuses, setBonuses] = useState<CardBonuses>(defaultBonuses);
  const [bonusesPercent, setBonusesPercent] = useState<Record<CardType, number>>({
    speed: 0,
    jump: 0,
    income: 0,
    power: 0,
    magnet: 0
  });
  const [powerContribution, setPowerContribution] = useState(0);
  const [totalCards, setTotalCards] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCards = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await cardsApi.getAll() as any;
      if (response.data) {
        setCards(response.data.cards || []);
        setBonuses(response.data.bonuses || defaultBonuses);
        setBonusesPercent(response.data.bonusesPercent || {
          speed: 0, jump: 0, income: 0, power: 0, magnet: 0
        });
        setPowerContribution(response.data.powerContribution || 0);
        setTotalCards(response.data.totalCards || 0);
      }
    } catch (err: any) {
      console.error('Failed to fetch cards:', err);
      setError(err.message || 'Failed to fetch cards');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const upgradeCard = useCallback(async (cardId: string): Promise<boolean> => {
    if (!token) return false;
    try {
      const response = await cardsApi.upgrade(cardId) as any;
      if (response.data) {
        setBonuses(response.data.bonuses || bonuses);
        setBonusesPercent(response.data.bonusesPercent || bonusesPercent);
        await refreshCards();
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Failed to upgrade card:', err);
      setError(err.message || 'Failed to upgrade card');
      return false;
    }
  }, [token, refreshCards, bonuses, bonusesPercent]);

  const getCardsByType = useCallback((type: CardType): CardWithDetails[] => {
    return cards.filter(card => card.type === type);
  }, [cards]);

  const getCardsByRarity = useCallback((rarity: CardRarity): CardWithDetails[] => {
    return cards.filter(card => card.rarity === rarity);
  }, [cards]);

  // Fetch cards when user logs in
  useEffect(() => {
    if (user && token) {
      refreshCards();
    } else {
      // Reset state when logged out
      setCards([]);
      setBonuses(defaultBonuses);
      setBonusesPercent({ speed: 0, jump: 0, income: 0, power: 0, magnet: 0 });
      setPowerContribution(0);
      setTotalCards(0);
    }
  }, [user, token, refreshCards]);

  const value = useMemo(() => ({
    cards,
    bonuses,
    bonusesPercent,
    powerContribution,
    totalCards,
    isLoading,
    error,
    refreshCards,
    upgradeCard,
    getCardsByType,
    getCardsByRarity
  }), [
    cards,
    bonuses,
    bonusesPercent,
    powerContribution,
    totalCards,
    isLoading,
    error,
    refreshCards,
    upgradeCard,
    getCardsByType,
    getCardsByRarity
  ]);

  return <CardContext.Provider value={value}>{children}</CardContext.Provider>;
}

export const useCards = () => {
  const context = useContext(CardContext);
  if (!context) {
    throw new Error('useCards must be used within CardProvider');
  }
  return context;
};
