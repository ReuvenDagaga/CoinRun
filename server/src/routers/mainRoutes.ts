import { Router } from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware.js';

// Runner controllers
import { startSoloGame, finishSoloGame, getLeaderboard, getPlayerStats } from '../controllers/runnerController.js';

// Upgrade controllers
import { getUpgrades, purchaseUpgrade } from '../controllers/upgradeController.js';

// Shop controllers
import { getSkins, buySkin, equipSkin, buyLootbox } from '../controllers/shopController.js';

// Mission controllers
import { getMissions, claimMission } from '../controllers/missionController.js';

// Achievement controllers
import { getAchievements } from '../controllers/achievementController.js';

// Settings controllers
import { getSettings, updateSettings } from '../controllers/settingsController.js';

// User controllers
import { updateUser } from '../controllers/userController.js';

import authRouter from './authRoutes.js';

const router = Router();

router.use('/auth', authRouter);


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

// ==================== Mission Routes ====================
router.get('/missions', authMiddleware, getMissions);
router.post('/missions/claim', authMiddleware, claimMission);

// ==================== Achievement Routes ====================
router.get('/achievements', authMiddleware, getAchievements);

// ==================== Settings Routes ====================
router.get('/settings', authMiddleware, getSettings);
router.put('/settings', authMiddleware, updateSettings);

// ==================== User Routes ====================
router.put('/user/update', authMiddleware, updateUser);

export default router;
