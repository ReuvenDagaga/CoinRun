import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { User, IUpgrades } from '../models/Users.js';
import { Transaction } from '../models/Transactions.js';

const UPGRADE_COSTS: Record<keyof IUpgrades, number> = {
  capacity: 5,
  addWarrior: 50,
  warriorUpgrade: 5,
  income: 5,
  speed: 20,
  jump: 15,
  bulletPower: 30,
  magnetRadius: 25
};

const MAX_LEVELS: Record<keyof IUpgrades, number> = {
  capacity: 20,
  addWarrior: 10,
  warriorUpgrade: 20,
  income: 20,
  speed: 15,
  jump: 10,
  bulletPower: 10,
  magnetRadius: 5
};

function calculateCost(type: keyof IUpgrades, currentLevel: number): number {
  return UPGRADE_COSTS[type] * Math.pow(2, currentLevel);
}

// Get all upgrades
export async function getUpgrades(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const upgradesWithCosts = Object.keys(user.upgrades.toObject()).reduce((acc, key) => {
      const upgradeKey = key as keyof IUpgrades;
      const currentLevel = user.upgrades[upgradeKey];
      const maxLevel = MAX_LEVELS[upgradeKey];
      const cost = currentLevel >= maxLevel ? null : calculateCost(upgradeKey, currentLevel);

      acc[upgradeKey] = {
        level: currentLevel,
        maxLevel,
        cost,
        canAfford: cost !== null && user.coins >= cost
      };
      return acc;
    }, {} as Record<string, unknown>);

    res.json({
      success: true,
      data: {
        upgrades: upgradesWithCosts,
        balance: user.coins
      }
    });
  } catch (error) {
    console.error('Get upgrades error:', error);
    res.status(500).json({ success: false, error: 'Failed to get upgrades' });
  }
}

// Purchase upgrade
export async function purchaseUpgrade(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { type } = req.params as { type: keyof IUpgrades };

    // Validate upgrade type
    if (!Object.keys(UPGRADE_COSTS).includes(type)) {
      return res.status(400).json({ success: false, error: 'Invalid upgrade type' });
    }

    const currentLevel = user.upgrades[type];
    const maxLevel = MAX_LEVELS[type];

    // Check if already maxed
    if (currentLevel >= maxLevel) {
      return res.status(400).json({ success: false, error: 'Upgrade already at max level' });
    }

    // Calculate cost
    const cost = calculateCost(type, currentLevel);

    // Check if user can afford
    if (user.coins < cost) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient coins',
        data: { required: cost, available: user.coins }
      });
    }

    // Apply upgrade
    const previousCoins = user.coins;
    user.coins -= cost;
    user.upgrades[type] = currentLevel + 1;

    await user.save();

    // Create transaction
    await Transaction.create({
      userId: user._id,
      type: 'purchase',
      currency: 'coins',
      amount: -cost,
      balanceBefore: previousCoins,
      balanceAfter: user.coins,
      description: `Upgrade ${type} to level ${currentLevel + 1}`
    });

    // Calculate new power level
    const powerLevel =
      user.upgrades.capacity * 10 +
      user.upgrades.addWarrior * 20 +
      user.upgrades.warriorUpgrade * 10 +
      user.upgrades.income * 5 +
      user.upgrades.speed * 8 +
      user.upgrades.jump * 6 +
      user.upgrades.bulletPower * 12 +
      user.upgrades.magnetRadius * 5;

    res.json({
      success: true,
      data: {
        upgrade: {
          type,
          newLevel: user.upgrades[type],
          maxLevel: MAX_LEVELS[type],
          nextCost: user.upgrades[type] >= MAX_LEVELS[type]
            ? null
            : calculateCost(type, user.upgrades[type])
        },
        balance: user.coins,
        powerLevel
      }
    });
  } catch (error) {
    console.error('Purchase upgrade error:', error);
    res.status(500).json({ success: false, error: 'Failed to purchase upgrade' });
  }
}
