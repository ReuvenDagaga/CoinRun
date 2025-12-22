// Card rarity levels with their bonus percentages
export type CardRarity = 'uncommon' | 'common' | 'rare' | 'epic' | 'legendary';

// Card types - the stats that cards can affect
export type CardType = 'speed' | 'jump' | 'income' | 'power' | 'magnet';

// Card definition interface
export interface ICard {
  id: string;           // Unique card ID like "speed_rare_01"
  type: CardType;       // The stat this card affects
  rarity: CardRarity;   // Rarity determines base bonus
  name: string;         // Display name
  description: string;  // Flavor text
  imageUrl: string;     // Path to card art
}

// Bonus percentages by rarity (as decimals)
export const CARD_RARITY_BONUS: Record<CardRarity, number> = {
  uncommon: 0.01,    // 1%
  common: 0.03,      // 3%
  rare: 0.05,        // 5%
  epic: 0.08,        // 8%
  legendary: 0.15    // 15%
};

// Rarity colors for UI
export const CARD_RARITY_COLORS: Record<CardRarity, string> = {
  uncommon: '#B0B0B0',
  common: '#00FF00',
  rare: '#0088FF',
  epic: '#AA00FF',
  legendary: '#FFD700'
};

// Stat type display info
export const CARD_STAT_DISPLAY: Record<CardType, { name: string; icon: string; color: string }> = {
  speed: { name: 'Speed', icon: 'speed_icon.png', color: '#00AAFF' },
  jump: { name: 'Jump', icon: 'jump_icon.png', color: '#00FF88' },
  income: { name: 'Income', icon: 'income_icon.png', color: '#FFD700' },
  power: { name: 'Power', icon: 'bullet_icon.png', color: '#FF4444' },
  magnet: { name: 'Magnet', icon: 'magnet_icon.png', color: '#AA44FF' }
};
