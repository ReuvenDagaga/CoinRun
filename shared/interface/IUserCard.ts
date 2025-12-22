// User's owned card instance
export interface IUserCard {
  cardId: string;              // Reference to ICard.id
  starLevel: number;           // 0, 1, 2, or 3 (0 = base, 3 = max)
  acquiredAt: Date;            // When the card was first obtained
  duplicatesConverted: number; // Track duplicate conversions for analytics
}

// Star level multiplies the card's bonus
// Star 0 = 1x, Star 1 = 2x, Star 2 = 3x, Star 3 = 4x
export const getStarMultiplier = (starLevel: number): number => starLevel + 1;

// Maximum star level
export const MAX_STAR_LEVEL = 3;

// Star upgrade costs
export const STAR_UPGRADE_COSTS: Record<1 | 2 | 3, { coins: number; gems: number }> = {
  1: { coins: 500, gems: 10 },     // 0 -> 1
  2: { coins: 2000, gems: 50 },    // 1 -> 2
  3: { coins: 10000, gems: 200 }   // 2 -> 3
};
