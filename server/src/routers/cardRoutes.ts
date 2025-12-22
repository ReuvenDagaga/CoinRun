import { Router } from 'express';
import { getCards, upgradeCard, getCardPoolInfo } from '../controllers/cardController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const cardRouter = Router();

// Get user's card collection (requires auth)
cardRouter.get('/', authMiddleware, getCards);

// Upgrade a card's star level (requires auth)
cardRouter.post('/upgrade', authMiddleware, upgradeCard);

// Get all available cards info (public endpoint)
cardRouter.get('/pool', getCardPoolInfo);

export default cardRouter;
