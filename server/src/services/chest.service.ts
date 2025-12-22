import { IUser } from '@shared/interface/IUser.js';
import { ChestTier, IChestReward, ITimedChest } from '@shared/interface/IChest.js';
import { CardRarity } from '@shared/interface/ICard.js';
import { CHEST_CONFIG, TIMED_CHEST_CONFIG, getRandomInRange } from '../config/chest.config.js';
import { CARD_POOL } from '../config/card.config.js';
import { addCardToUser } from './card.service.js';
import { ChestHistory } from '../models/ChestHistory.js';
import { Transaction } from '../models/Transactions.js';
import { LOGGER } from '../log/logger.js';

/**
 * Roll for card rarity based on chest tier and pity counter
 */
const rollCardRarity = (tier: ChestTier, pityCount: number): CardRarity => {
  const config = CHEST_CONFIG[tier];
  const pityThreshold = TIMED_CHEST_CONFIG.PITY_THRESHOLDS[tier];

  // Pity system: guaranteed legendary after threshold
  if (pityCount >= pityThreshold) {
    LOGGER.info(`Pity triggered for ${tier} chest after ${pityCount} pulls`);
    return 'legendary';
  }

  const roll = Math.random();
  let cumulative = 0;

  // Roll from rarest to most common
  const rarities: CardRarity[] = ['legendary', 'epic', 'rare', 'common', 'uncommon'];
  for (const rarity of rarities) {
    cumulative += config.dropRates[rarity];
    if (roll < cumulative) {
      return rarity;
    }
  }

  return 'uncommon';
};

/**
 * Get a random card of specific rarity
 */
const getRandomCardOfRarity = (rarity: CardRarity): string => {
  const cardsOfRarity = CARD_POOL.filter(c => c.rarity === rarity);
  if (cardsOfRarity.length === 0) {
    // Fallback to any card if no cards of this rarity exist
    LOGGER.warn(`No cards found for rarity ${rarity}, falling back to random`);
    return CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)].id;
  }
  return cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)].id;
};

/**
 * Open a chest and get rewards
 */
export const openChest = async (
  user: IUser,
  tier: ChestTier,
  source: 'timed' | 'purchased' | 'reward'
): Promise<IChestReward> => {
  const config = CHEST_CONFIG[tier];

  // Determine number of cards
  const cardCount = getRandomInRange(config.cardCount.min, config.cardCount.max);

  const cards: IChestReward['cards'] = [];
  let gotLegendary = false;

  for (let i = 0; i < cardCount; i++) {
    const rarity = rollCardRarity(tier, user.pityCounter[tier]);
    const cardId = getRandomCardOfRarity(rarity);

    if (rarity === 'legendary') {
      gotLegendary = true;
    }

    const result = addCardToUser(user, cardId);

    cards.push({
      cardId,
      rarity,
      isDuplicate: result.isDuplicate,
      conversionReward: result.conversionReward
    });
  }

  // Update pity counter
  if (gotLegendary) {
    user.pityCounter[tier] = 0;
  } else {
    user.pityCounter[tier] += 1;
  }

  // Roll for coins and gems
  const coins = getRandomInRange(config.coinRange.min, config.coinRange.max);
  const gems = getRandomInRange(config.gemRange.min, config.gemRange.max);

  // Apply rewards
  const prevCoins = user.coins;
  const prevGems = user.gems;
  user.coins += coins;
  user.gems += gems;
  user.totalChestsOpened += 1;

  await user.save();

  // Create transaction records
  if (coins > 0) {
    await Transaction.create({
      userId: user._id,
      type: 'shop_purchase',
      currency: 'coins',
      amount: coins,
      balanceBefore: prevCoins,
      balanceAfter: user.coins,
      description: `${tier} chest reward`,
      metadata: { chestTier: tier, source }
    });
  }

  if (gems > 0) {
    await Transaction.create({
      userId: user._id,
      type: 'shop_purchase',
      currency: 'gems',
      amount: gems,
      balanceBefore: prevGems,
      balanceAfter: user.gems,
      description: `${tier} chest reward`,
      metadata: { chestTier: tier, source }
    });
  }

  // Record chest history
  await ChestHistory.create({
    userId: user._id,
    chestTier: tier,
    source,
    rewards: { cards, coins, gems }
  });

  LOGGER.info(`User ${user._id} opened ${tier} chest (${source}): ${cardCount} cards, ${coins} coins, ${gems} gems`);

  return { cards, coins, gems };
};

/**
 * Purchase a chest with gems
 */
export const purchaseChest = async (user: IUser, tier: ChestTier): Promise<IChestReward> => {
  const config = CHEST_CONFIG[tier];

  if (user.gems < config.gemCost) {
    throw new Error(`Insufficient gems. Need ${config.gemCost}, have ${user.gems}`);
  }

  const prevGems = user.gems;
  user.gems -= config.gemCost;

  await Transaction.create({
    userId: user._id,
    type: 'shop_purchase',
    currency: 'gems',
    amount: -config.gemCost,
    balanceBefore: prevGems,
    balanceAfter: user.gems,
    description: `Purchased ${tier} chest`,
    relatedItemId: `chest_${tier}`
  });

  LOGGER.info(`User ${user._id} purchased ${tier} chest for ${config.gemCost} gems`);

  return openChest(user, tier, 'purchased');
};

/**
 * Check if user has a ready timed chest
 */
export const checkTimedChest = (user: IUser): ITimedChest | null => {
  if (!user.timedChest) return null;
  if (user.timedChest.claimed) return null;

  const now = new Date();
  if (now >= user.timedChest.availableAt) {
    return user.timedChest;
  }

  return null;
};

/**
 * Generate next timed chest for user
 */
export const generateNextTimedChest = (user: IUser): ITimedChest => {
  const weights = TIMED_CHEST_CONFIG.TIER_WEIGHTS;
  const roll = Math.random();

  let tier: ChestTier;
  if (roll < weights.gold) {
    tier = 'gold';
  } else if (roll < weights.gold + weights.silver) {
    tier = 'silver';
  } else {
    tier = 'bronze';
  }

  const availableAt = new Date(Date.now() + TIMED_CHEST_CONFIG.INTERVAL_SECONDS * 1000);

  user.timedChest = {
    tier,
    availableAt,
    claimed: false
  } as ITimedChest;

  LOGGER.debug(`Generated next timed chest for user ${user._id}: ${tier} at ${availableAt}`);

  return user.timedChest;
};

/**
 * Claim timed chest
 */
export const claimTimedChest = async (user: IUser): Promise<IChestReward> => {
  const chest = checkTimedChest(user);
  if (!chest) {
    throw new Error('No chest available to claim');
  }

  user.timedChest!.claimed = true;
  user.lastChestTime = new Date();

  const reward = await openChest(user, chest.tier, 'timed');

  // Generate next chest
  generateNextTimedChest(user);

  await user.save();

  return reward;
};

/**
 * Get chest status for client
 */
export const getChestStatus = (user: IUser) => {
  const now = Date.now();

  if (!user.timedChest || user.timedChest.claimed) {
    // No chest pending, generate one
    generateNextTimedChest(user);
  }

  const chest = user.timedChest!;
  const availableIn = Math.max(0, new Date(chest.availableAt).getTime() - now);
  const isReady = availableIn === 0 && !chest.claimed;

  return {
    tier: chest.tier,
    isReady,
    availableIn,
    availableAt: chest.availableAt,
    claimed: chest.claimed
  };
};

/**
 * Get drop rate info for transparency
 */
export const getDropRateInfo = () => {
  return {
    bronze: CHEST_CONFIG.bronze.dropRates,
    silver: CHEST_CONFIG.silver.dropRates,
    gold: CHEST_CONFIG.gold.dropRates,
    pityThresholds: TIMED_CHEST_CONFIG.PITY_THRESHOLDS,
    prices: {
      bronze: CHEST_CONFIG.bronze.gemCost,
      silver: CHEST_CONFIG.silver.gemCost,
      gold: CHEST_CONFIG.gold.gemCost
    },
    contents: {
      bronze: {
        cards: CHEST_CONFIG.bronze.cardCount,
        coins: CHEST_CONFIG.bronze.coinRange,
        gems: CHEST_CONFIG.bronze.gemRange
      },
      silver: {
        cards: CHEST_CONFIG.silver.cardCount,
        coins: CHEST_CONFIG.silver.coinRange,
        gems: CHEST_CONFIG.silver.gemRange
      },
      gold: {
        cards: CHEST_CONFIG.gold.cardCount,
        coins: CHEST_CONFIG.gold.coinRange,
        gems: CHEST_CONFIG.gold.gemRange
      }
    },
    timedChest: {
      intervalSeconds: TIMED_CHEST_CONFIG.INTERVAL_SECONDS,
      tierWeights: TIMED_CHEST_CONFIG.TIER_WEIGHTS
    }
  };
};

/**
 * Get user's chest history
 */
export const getChestHistory = async (userId: string, limit: number = 20) => {
  return ChestHistory.find({ userId })
    .sort({ openedAt: -1 })
    .limit(limit)
    .lean();
};
