import { Router } from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware.js';

// Auth controllers
import { googleAuth, getCurrentUser, logout } from '../controllers/authController.js';

// Runner controllers
import { startSoloGame, finishSoloGame, getLeaderboard, getPlayerStats } from '../controllers/runnerController.js';

// Upgrade controllers
import { getUpgrades, purchaseUpgrade } from '../controllers/upgradeController.js';

// Shop controllers
import { getSkins, buySkin, equipSkin, buyLootbox } from '../controllers/shopController.js';

const router = Router();

// ==================== Auth Routes ====================
// ✅ GOOGLE OAUTH ONLY - No username/password, no anonymous
router.post('/auth/google', googleAuth);
router.get('/auth/me', authMiddleware, getCurrentUser);
router.post('/auth/logout', authMiddleware, logout);

// ==================== Runner Game Routes ====================
router.post('/runner/solo', authMiddleware, startSoloGame);
router.post('/runner/solo/finish', authMiddleware, finishSoloGame);
router.get('/runner/leaderboard', optionalAuthMiddleware, getLeaderboard);
router.get('/runner/stats', authMiddleware, getPlayerStats);

// ==================== Upgrade Routes ====================
router.get('/upgrades', authMiddleware, getUpgrades);
router.post('/upgrades/:type', authMiddleware, purchaseUpgrade);

// ==================== Shop Routes ====================
// ❌ REMOVED: buyGems with USDT (crypto removed)
router.get('/shop/skins', optionalAuthMiddleware, getSkins);
router.post('/shop/buy/skin', authMiddleware, buySkin);
router.post('/shop/equip/skin', authMiddleware, equipSkin);
router.post('/shop/buy/lootbox', authMiddleware, buyLootbox);

// ❌ REMOVED: Old daily login/spin system (replaced by missions)
// ❌ REMOVED: Wallet routes (USDT/crypto removed)

export default router;
