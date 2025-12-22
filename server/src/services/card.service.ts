import { IUser } from '@shared/interface/IUser.js';
import { IUserCard } from '@shared/interface/IUserCard.js';
import { CardRarity, CardType, CARD_RARITY_BONUS } from '@shared/interface/ICard.js';
import { CARD_POOL, STAR_UPGRADE_COSTS, DUPLICATE_CONVERSION, POWER_PER_STAR, getCardDefinition } from '../config/card.config.js';
import { Transaction } from '../models/Transactions.js';
import { LOGGER } from '../log/logger.js';

// Card bonus for a specific stat type
export interface CardBonuses {
  speed: number;
  jump: number;
  income: number;
  power: number;
  magnet: number;
}

/**
 * Calculate total card bonus for a specific stat type
 * Returns the bonus as a decimal (e.g., 0.15 for 15%)
 */
export const getCardBonus = (cards: IUserCard[], statType: CardType): number => {
  let totalBonus = 0;

  for (const userCard of cards) {
    const cardDef = getCardDefinition(userCard.cardId);
    if (cardDef && cardDef.type === statType) {
      const rarityBonus = CARD_RARITY_BONUS[cardDef.rarity];
      const starMultiplier = userCard.starLevel + 1; // 1x, 2x, 3x, or 4x
      totalBonus += rarityBonus * starMultiplier;
    }
  }

  return totalBonus;
};

/**
 * Get all card bonuses for a user
 */
export const getAllCardBonuses = (cards: IUserCard[]): CardBonuses => {
  return {
    speed: getCardBonus(cards, 'speed'),
    jump: getCardBonus(cards, 'jump'),
    income: getCardBonus(cards, 'income'),
    power: getCardBonus(cards, 'power'),
    magnet: getCardBonus(cards, 'magnet')
  };
};

/**
 * Get user's card inventory with full details
 */
export const getCardInventory = (user: IUser) => {
  return user.cards.map(userCard => {
    const cardDef = getCardDefinition(userCard.cardId);
    if (!cardDef) return null;

    const rarityBonus = CARD_RARITY_BONUS[cardDef.rarity];
    const starMultiplier = userCard.starLevel + 1;
    const currentBonus = rarityBonus * starMultiplier;
    const nextStarBonus = userCard.starLevel < 3
      ? rarityBonus * (starMultiplier + 1)
      : currentBonus;

    const upgradeCost = userCard.starLevel < 3
      ? STAR_UPGRADE_COSTS[(userCard.starLevel + 1) as 1 | 2 | 3]
      : null;

    // Can upgrade only if not at max level AND user has enough resources
    const canUpgrade = userCard.starLevel < 3 &&
      upgradeCost !== null &&
      user.coins >= upgradeCost.coins &&
      user.gems >= upgradeCost.gems;

    return {
      ...cardDef,
      cardId: userCard.cardId,
      starLevel: userCard.starLevel,
      acquiredAt: userCard.acquiredAt,
      duplicatesConverted: userCard.duplicatesConverted,
      currentBonus,
      currentBonusPercent: Math.round(currentBonus * 100),
      nextStarBonus,
      nextStarBonusPercent: Math.round(nextStarBonus * 100),
      canUpgrade,
      upgradeCost,
      imageUrl: `/ui/cards/${cardDef.type}/${cardDef.id}.png`
    };
  }).filter(Boolean);
};

/**
 * Upgrade a card's star level
 */
export const upgradeCardStar = async (user: IUser, cardId: string) => {
  const userCard = user.cards.find(c => c.cardId === cardId);
  if (!userCard) {
    throw new Error('Card not found in your collection');
  }
  if (userCard.starLevel >= 3) {
    throw new Error('Card is already at maximum star level');
  }

  const newStarLevel = (userCard.starLevel + 1) as 1 | 2 | 3;
  const cost = STAR_UPGRADE_COSTS[newStarLevel];

  if (user.coins < cost.coins) {
    throw new Error(`Insufficient coins. Need ${cost.coins}, have ${user.coins}`);
  }
  if (user.gems < cost.gems) {
    throw new Error(`Insufficient gems. Need ${cost.gems}, have ${user.gems}`);
  }

  const prevCoins = user.coins;
  const prevGems = user.gems;

  user.coins -= cost.coins;
  user.gems -= cost.gems;
  userCard.starLevel = newStarLevel;

  await user.save();

  // Create transaction records
  if (cost.coins > 0) {
    await Transaction.create({
      userId: user._id,
      type: 'upgrade_purchase',
      currency: 'coins',
      amount: -cost.coins,
      balanceBefore: prevCoins,
      balanceAfter: user.coins,
      description: `Card star upgrade: ${cardId} to Star ${newStarLevel}`,
      relatedItemId: cardId
    });
  }

  if (cost.gems > 0) {
    await Transaction.create({
      userId: user._id,
      type: 'upgrade_purchase',
      currency: 'gems',
      amount: -cost.gems,
      balanceBefore: prevGems,
      balanceAfter: user.gems,
      description: `Card star upgrade: ${cardId} to Star ${newStarLevel}`,
      relatedItemId: cardId
    });
  }

  LOGGER.info(`User ${user._id} upgraded card ${cardId} to Star ${newStarLevel}`);

  return {
    card: userCard,
    newBalance: { coins: user.coins, gems: user.gems }
  };
};

/**
 * Add a card to user's inventory (handles duplicates)
 */
export const addCardToUser = (
  user: IUser,
  cardId: string
): { isDuplicate: boolean; conversionReward?: { coins: number; gems: number } } => {
  const cardDef = getCardDefinition(cardId);
  if (!cardDef) {
    throw new Error(`Invalid card ID: ${cardId}`);
  }

  const existingCard = user.cards.find(c => c.cardId === cardId);

  if (existingCard) {
    // Duplicate - convert to resources
    const reward = DUPLICATE_CONVERSION[cardDef.rarity];
    user.coins += reward.coins;
    user.gems += reward.gems;
    existingCard.duplicatesConverted += 1;

    LOGGER.debug(`User ${user._id} received duplicate card ${cardId}, converted to ${reward.coins} coins, ${reward.gems} gems`);

    return { isDuplicate: true, conversionReward: reward };
  } else {
    // New card - add to collection
    user.cards.push({
      cardId,
      starLevel: 0,
      acquiredAt: new Date(),
      duplicatesConverted: 0
    } as IUserCard);

    LOGGER.debug(`User ${user._id} received new card ${cardId}`);

    return { isDuplicate: false };
  }
};

/**
 * Calculate card contribution to power level
 */
export const getCardPowerContribution = (cards: IUserCard[]): number => {
  return cards.reduce((total, card) => {
    return total + (card.starLevel + 1) * POWER_PER_STAR;
  }, 0);
};

/**
 * Get available cards pool info
 */
export const getCardPool = () => {
  return {
    cards: CARD_POOL.map(card => ({
      ...card,
      bonus: CARD_RARITY_BONUS[card.rarity],
      bonusPercent: Math.round(CARD_RARITY_BONUS[card.rarity] * 100),
      imageUrl: `/ui/cards/${card.type}/${card.id}.png`
    })),
    starUpgradeCosts: STAR_UPGRADE_COSTS,
    duplicateConversion: DUPLICATE_CONVERSION,
    rarityBonuses: Object.fromEntries(
      Object.entries(CARD_RARITY_BONUS).map(([rarity, bonus]) => [
        rarity,
        { decimal: bonus, percent: Math.round(bonus * 100) }
      ])
    )
  };
};

/**
 * Get cards grouped by type
 */
export const getCardsByType = (cards: IUserCard[]): Record<CardType, IUserCard[]> => {
  const grouped: Record<CardType, IUserCard[]> = {
    speed: [],
    jump: [],
    income: [],
    power: [],
    magnet: []
  };

  for (const card of cards) {
    const def = getCardDefinition(card.cardId);
    if (def) {
      grouped[def.type].push(card);
    }
  }

  return grouped;
};
