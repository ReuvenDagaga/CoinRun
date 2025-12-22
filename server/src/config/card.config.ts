import { CardRarity, CardType } from '@shared/interface/ICard.js';

// Star upgrade costs
export const STAR_UPGRADE_COSTS: Record<1 | 2 | 3, { coins: number; gems: number }> = {
  1: { coins: 500, gems: 10 },     // 0 -> 1
  2: { coins: 2000, gems: 50 },    // 1 -> 2
  3: { coins: 10000, gems: 200 }   // 2 -> 3
};

// Duplicate conversion rewards by rarity
export const DUPLICATE_CONVERSION: Record<CardRarity, { coins: number; gems: number }> = {
  uncommon: { coins: 50, gems: 0 },
  common: { coins: 100, gems: 1 },
  rare: { coins: 250, gems: 5 },
  epic: { coins: 500, gems: 15 },
  legendary: { coins: 1000, gems: 50 }
};

// Power level contribution per card star
export const POWER_PER_STAR = 5;

// Card pool - all available cards in the game
export interface CardDefinition {
  id: string;
  type: CardType;
  rarity: CardRarity;
  name: string;
  description: string;
}

export const CARD_POOL: CardDefinition[] = [
  // Speed Cards
  { id: 'speed_uncommon_01', type: 'speed', rarity: 'uncommon', name: 'Swift Feet', description: 'A slight boost to your running speed.' },
  { id: 'speed_common_01', type: 'speed', rarity: 'common', name: 'Quick Runner', description: 'Move faster across the track.' },
  { id: 'speed_rare_01', type: 'speed', rarity: 'rare', name: 'Wind Walker', description: 'The wind is at your back.' },
  { id: 'speed_epic_01', type: 'speed', rarity: 'epic', name: 'Lightning Sprint', description: 'Move with electric speed.' },
  { id: 'speed_legendary_01', type: 'speed', rarity: 'legendary', name: 'Sonic Surge', description: 'Break the sound barrier!' },

  // Jump Cards
  { id: 'jump_uncommon_01', type: 'jump', rarity: 'uncommon', name: 'Light Hop', description: 'A small boost to your jumps.' },
  { id: 'jump_common_01', type: 'jump', rarity: 'common', name: 'Spring Step', description: 'Jump a bit higher.' },
  { id: 'jump_rare_01', type: 'jump', rarity: 'rare', name: 'Sky Leaper', description: 'Reach new heights.' },
  { id: 'jump_epic_01', type: 'jump', rarity: 'epic', name: 'Cloud Jumper', description: 'Touch the clouds!' },
  { id: 'jump_legendary_01', type: 'jump', rarity: 'legendary', name: 'Gravity Defier', description: 'Who needs gravity anyway?' },

  // Income Cards
  { id: 'income_uncommon_01', type: 'income', rarity: 'uncommon', name: 'Penny Saver', description: 'Find a few extra coins.' },
  { id: 'income_common_01', type: 'income', rarity: 'common', name: 'Coin Collector', description: 'Coins are worth more.' },
  { id: 'income_rare_01', type: 'income', rarity: 'rare', name: 'Gold Finder', description: 'Discover hidden riches.' },
  { id: 'income_epic_01', type: 'income', rarity: 'epic', name: 'Treasure Hunter', description: 'Every coin is a treasure.' },
  { id: 'income_legendary_01', type: 'income', rarity: 'legendary', name: 'Midas Touch', description: 'Everything turns to gold!' },

  // Bullet Power Cards
  { id: 'power_uncommon_01', type: 'power', rarity: 'uncommon', name: 'Sharp Shot', description: 'Slightly stronger bullets.' },
  { id: 'power_common_01', type: 'power', rarity: 'common', name: 'Power Shot', description: 'Hit harder.' },
  { id: 'power_rare_01', type: 'power', rarity: 'rare', name: 'Heavy Caliber', description: 'Serious firepower.' },
  { id: 'power_epic_01', type: 'power', rarity: 'epic', name: 'Armor Piercer', description: 'Nothing stops these bullets.' },
  { id: 'power_legendary_01', type: 'power', rarity: 'legendary', name: 'Devastator', description: 'Absolute destruction!' },

  // Magnet Radius Cards
  { id: 'magnet_uncommon_01', type: 'magnet', rarity: 'uncommon', name: 'Coin Magnet', description: 'Attract nearby coins.' },
  { id: 'magnet_common_01', type: 'magnet', rarity: 'common', name: 'Strong Pull', description: 'Draw coins from further away.' },
  { id: 'magnet_rare_01', type: 'magnet', rarity: 'rare', name: 'Gravity Well', description: 'Coins cant escape you.' },
  { id: 'magnet_epic_01', type: 'magnet', rarity: 'epic', name: 'Vortex', description: 'A powerful magnetic field.' },
  { id: 'magnet_legendary_01', type: 'magnet', rarity: 'legendary', name: 'Black Hole', description: 'All coins belong to you!' }
];

// Get card definition by ID
export const getCardDefinition = (cardId: string): CardDefinition | undefined => {
  return CARD_POOL.find(c => c.id === cardId);
};

// Get all cards of a specific type
export const getCardsByType = (type: CardType): CardDefinition[] => {
  return CARD_POOL.filter(c => c.type === type);
};

// Get all cards of a specific rarity
export const getCardsByRarity = (rarity: CardRarity): CardDefinition[] => {
  return CARD_POOL.filter(c => c.rarity === rarity);
};
