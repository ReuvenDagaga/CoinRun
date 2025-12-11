import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { User, IUpgrades } from '../models/Users.js';
import { Transaction } from '../models/Transactions.js';
import { updateAchievementProgress } from './achievementController.js';

/**
 * Base costs for each upgrade type
 * Cost formula: baseCost × (1.5 ^ currentLevel)
 *
 * Examples for speed (base 100):
 * - Level 0→1:  100 × 1.5^0  = 100 coins
 * - Level 1→2:  100 × 1.5^1  = 150 coins
 * - Level 10→11: 100 × 1.5^10 = 5,767 coins
 * - Level 20→21: 100 × 1.5^20 = 325,779 coins
 *
 * INFINITE LEVELS - No max level restrictions!
 */
const BASE_COSTS: Record<keyof IUpgrades, number> = {
  capacity: 200,        // Army capacity
  addWarrior: 500,      // Starting army size
  warriorUpgrade: 300,  // Warrior power
  income: 150,          // Coin value multiplier
  speed: 100,           // Movement speed
  jump: 250,            // Jump height
  bulletPower: 400,     // Bullet damage
  magnetRadius: 200     // Coin magnet radius
};

/**
 * Calculate upgrade cost using exponential formula
 * Formula: baseCost × (1.5 ^ currentLevel)
 */
function calculateCost(type: keyof IUpgrades, currentLevel: number): number {
  const baseCost = BASE_COSTS[type];
  return Math.floor(baseCost * Math.pow(1.5, currentLevel));
}

/**
 * Calculate upgrade power/effect with 10-level multiplier
 *
 * Formula:
 * - linearPower = level × baseEffect
 * - multiplier = 2 ^ (level ÷ 10)
 * - totalPower = linearPower × multiplier
 *
 * Example for speed at level 25:
 * - Linear: 25 × 0.02 = 0.5 (50%)
 * - Multiplier: 2^2 = 4x (crossed levels 10 and 20)
 * - Total: 0.5 × 4 = 2.0 (200% speed!)
 */
const BASE_EFFECTS: Record<keyof IUpgrades, number> = {
  capacity: 1,          // +1 soldier per level
  addWarrior: 0.5,      // +0.5 starting soldiers per level
  warriorUpgrade: 0.05, // +5% warrior power per level
  income: 0.01,         // +1% coin value per level
  speed: 0.02,          // +2% speed per level
  jump: 0.02,           // +2% jump height per level
  bulletPower: 0.03,    // +3% bullet damage per level
  magnetRadius: 0.1     // +0.1m magnet radius per level
};

function calculatePower(type: keyof IUpgrades, level: number): number {
  const baseEffect = BASE_EFFECTS[type];
  const linearPower = level * baseEffect;
  const multiplier = Math.pow(2, Math.floor(level / 10));
  return linearPower * multiplier;
}

/**
 * Get all upgrades with costs and power
 */
export async function getUpgrades(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const upgradesWithCosts = Object.keys(user.upgrades.toObject()).reduce((acc, key) => {
      const upgradeKey = key as keyof IUpgrades;
      const currentLevel = user.upgrades[upgradeKey];
      const cost = calculateCost(upgradeKey, currentLevel);
      const power = calculatePower(upgradeKey, currentLevel);
      const nextPower = calculatePower(upgradeKey, currentLevel + 1);

      acc[upgradeKey] = {
        level: currentLevel,
        cost, // Cost to upgrade to next level
        power: power.toFixed(2),
        nextPower: nextPower.toFixed(2),
        canAfford: user.coins >= cost
      };
      return acc;
    }, {} as Record<string, unknown>);

    res.json({
      success: true,
      data: {
        upgrades: upgradesWithCosts,
        balance: user.coins,
        powerLevel: user.getPowerLevel()
      }
    });
  } catch (error) {
    console.error('Get upgrades error:', error);
    res.status(500).json({ success: false, error: 'Failed to get upgrades' });
  }
}

/**
 * Purchase upgrade (infinite levels)
 */
export async function purchaseUpgrade(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { type } = req.params as { type: keyof IUpgrades };

    // Validate upgrade type
    if (!Object.keys(BASE_COSTS).includes(type)) {
      return res.status(400).json({ success: false, error: 'Invalid upgrade type' });
    }

    const currentLevel = user.upgrades[type];

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
      type: 'upgrade_purchase',
      currency: 'coins',
      amount: -cost,
      balanceBefore: previousCoins,
      balanceAfter: user.coins,
      description: `Upgrade ${type} to level ${currentLevel + 1}`,
      metadata: {
        upgradeType: type,
        fromLevel: currentLevel,
        toLevel: currentLevel + 1
      }
    });

    // Update achievement progress
    await updateAchievementProgress(user._id.toString(), {
      upgradeType: type,
      upgradeLevel: currentLevel + 1
    });

    // Calculate new power
    const newPower = calculatePower(type, currentLevel + 1);
    const nextCost = calculateCost(type, currentLevel + 1);

    res.json({
      success: true,
      data: {
        upgrade: {
          type,
          newLevel: user.upgrades[type],
          power: newPower.toFixed(2),
          nextCost,
          nextPower: calculatePower(type, currentLevel + 2).toFixed(2)
        },
        balance: user.coins,
        powerLevel: user.getPowerLevel()
      }
    });
  } catch (error) {
    console.error('Purchase upgrade error:', error);
    res.status(500).json({ success: false, error: 'Failed to purchase upgrade' });
  }
}
