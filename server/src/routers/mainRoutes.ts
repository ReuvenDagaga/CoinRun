import { Router } from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware.js';

// Auth controllers
import { register, login, googleAuth, getCurrentUser, logout } from '../controllers/authController.js';

// Runner controllers
import { startSoloGame, finishSoloGame, getLeaderboard, getPlayerStats } from '../controllers/runnerController.js';

// Upgrade controllers
import { getUpgrades, purchaseUpgrade } from '../controllers/upgradeController.js';

// Shop controllers
import { getSkins, buySkin, equipSkin, buyLootbox, buyGems } from '../controllers/shopController.js';

const router = Router();

// ==================== Auth Routes ====================
router.post('/auth/register', register);
router.post('/auth/login', login);
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
router.get('/shop/skins', optionalAuthMiddleware, getSkins);
router.post('/shop/buy/skin', authMiddleware, buySkin);
router.post('/shop/equip/skin', authMiddleware, equipSkin);
router.post('/shop/buy/lootbox', authMiddleware, buyLootbox);
router.post('/shop/buy/gems', authMiddleware, buyGems);

// ==================== Daily Routes ====================
router.post('/daily/login', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastReward = user.lastDailyReward ? new Date(user.lastDailyReward) : null;
    if (lastReward) {
      lastReward.setHours(0, 0, 0, 0);
    }

    // Check if already claimed today
    if (lastReward && lastReward.getTime() === today.getTime()) {
      return res.status(400).json({ success: false, error: 'Already claimed today' });
    }

    // Check streak
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isConsecutive = lastReward && lastReward.getTime() === yesterday.getTime();
    const newStreak = isConsecutive ? Math.min(user.dailyStreak + 1, 7) : 1;

    // Rewards based on streak
    const rewards = [
      { coins: 50 },
      { coins: 75 },
      { coins: 100, gems: 10 },
      { coins: 150 },
      { coins: 200, gems: 25 },
      { coins: 300 },
      { coins: 500, gems: 50 }
    ];

    const reward = rewards[newStreak - 1];

    // Apply rewards
    user.coins += reward.coins;
    if (reward.gems) {
      user.gems += reward.gems;
    }
    user.lastDailyReward = new Date();
    user.dailyStreak = newStreak;

    await user.save();

    res.json({
      success: true,
      data: {
        reward,
        streak: newStreak,
        balance: { coins: user.coins, gems: user.gems }
      }
    });
  } catch (error) {
    console.error('Daily login error:', error);
    res.status(500).json({ success: false, error: 'Failed to claim daily reward' });
  }
});

router.post('/daily/spin', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    if (user.spinUsedToday) {
      return res.status(400).json({ success: false, error: 'Spin already used today' });
    }

    // Spin prizes
    const prizes = [
      { coins: 50, weight: 30 },
      { coins: 100, weight: 25 },
      { coins: 200, weight: 20 },
      { coins: 500, weight: 10 },
      { coins: 1000, weight: 5 },
      { gems: 10, weight: 5 },
      { gems: 25, weight: 3 },
      { gems: 50, weight: 2 }
    ];

    // Weighted random selection
    const totalWeight = prizes.reduce((sum, p) => sum + p.weight, 0);
    let random = Math.random() * totalWeight;

    let selectedPrize = prizes[0];
    for (const prize of prizes) {
      random -= prize.weight;
      if (random <= 0) {
        selectedPrize = prize;
        break;
      }
    }

    // Apply prize
    if (selectedPrize.coins) {
      user.coins += selectedPrize.coins;
    }
    if (selectedPrize.gems) {
      user.gems += selectedPrize.gems;
    }
    user.spinUsedToday = true;

    await user.save();

    res.json({
      success: true,
      data: {
        prize: selectedPrize,
        balance: { coins: user.coins, gems: user.gems }
      }
    });
  } catch (error) {
    console.error('Daily spin error:', error);
    res.status(500).json({ success: false, error: 'Failed to spin' });
  }
});

// ==================== Wallet Routes (Placeholder) ====================
router.get('/wallet/balance', authMiddleware, async (req, res) => {
  const user = (req as any).user;
  res.json({
    success: true,
    data: {
      usdt: user.usdtBalance,
      coins: user.coins,
      gems: user.gems
    }
  });
});

router.get('/wallet/transactions', authMiddleware, async (req, res) => {
  try {
    const { Transaction } = await import('../models/Transactions.js');
    const user = (req as any).user;

    const transactions = await Transaction.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get transactions' });
  }
});

export default router;
