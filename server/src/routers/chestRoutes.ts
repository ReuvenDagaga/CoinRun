import { Router } from 'express';
import { getStatus, claimChest, buyChest, getDropRates, getHistory } from '../controllers/chestController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const chestRouter = Router();

// Get current timed chest status (requires auth)
chestRouter.get('/status', authMiddleware, getStatus);

// Claim the ready timed chest (requires auth)
chestRouter.post('/claim', authMiddleware, claimChest);

// Purchase a chest with gems (requires auth)
chestRouter.post('/buy', authMiddleware, buyChest);

// Get user's chest history (requires auth)
chestRouter.get('/history', authMiddleware, getHistory);

// Get drop rates info (public endpoint for transparency)
chestRouter.get('/rates', getDropRates);

export default chestRouter;
