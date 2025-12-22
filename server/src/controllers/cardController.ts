import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { ApiRes } from '../utils/response.js';
import { LOGGER } from '../log/logger.js';
import {
  getCardInventory,
  upgradeCardStar,
  getAllCardBonuses,
  getCardPowerContribution,
  getCardPool
} from '../services/card.service.js';
import { CARD_RARITY_COLORS, CARD_STAT_DISPLAY } from '@shared/interface/ICard.js';

/**
 * Get user's card collection
 */
export const getCards = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return ApiRes.unauthorized(res);

    const inventory = getCardInventory(user);
    const bonuses = getAllCardBonuses(user.cards);
    const powerContribution = getCardPowerContribution(user.cards);

    return ApiRes.ok(res, {
      cards: inventory,
      bonuses,
      bonusesPercent: {
        speed: Math.round(bonuses.speed * 100),
        jump: Math.round(bonuses.jump * 100),
        income: Math.round(bonuses.income * 100),
        power: Math.round(bonuses.power * 100),
        magnet: Math.round(bonuses.magnet * 100)
      },
      powerContribution,
      totalCards: user.cards.length,
      config: {
        rarityColors: CARD_RARITY_COLORS,
        statDisplay: CARD_STAT_DISPLAY
      }
    });
  } catch (error: any) {
    LOGGER.error('Get cards error:', error.message);
    return ApiRes.serverError(res, 'Failed to get cards');
  }
};

/**
 * Upgrade a card's star level
 */
export const upgradeCard = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return ApiRes.unauthorized(res);

    const { cardId } = req.body;
    if (!cardId) {
      return ApiRes.badRequest(res, 'Card ID is required');
    }

    const result = await upgradeCardStar(user, cardId);
    const bonuses = getAllCardBonuses(user.cards);

    return ApiRes.ok(res, {
      card: result.card,
      newBalance: result.newBalance,
      bonuses,
      bonusesPercent: {
        speed: Math.round(bonuses.speed * 100),
        jump: Math.round(bonuses.jump * 100),
        income: Math.round(bonuses.income * 100),
        power: Math.round(bonuses.power * 100),
        magnet: Math.round(bonuses.magnet * 100)
      }
    });
  } catch (error: any) {
    LOGGER.error('Upgrade card error:', error.message);
    if (error.message.includes('Insufficient') || error.message.includes('not found') || error.message.includes('maximum')) {
      return ApiRes.badRequest(res, error.message);
    }
    return ApiRes.serverError(res, 'Failed to upgrade card');
  }
};

/**
 * Get all available cards info (public endpoint)
 */
export const getCardPoolInfo = async (_req: AuthRequest, res: Response) => {
  try {
    const poolInfo = getCardPool();
    return ApiRes.ok(res, poolInfo);
  } catch (error: any) {
    LOGGER.error('Get card pool error:', error.message);
    return ApiRes.serverError(res, 'Failed to get card pool');
  }
};
