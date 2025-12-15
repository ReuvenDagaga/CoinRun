import { IUser } from "@shared/interface/IUser";
import { IUpgrades } from "@shared/interface/IUpgrades";
import { UPGRADE_CONFIG, UPGRADE_TYPES } from "../config/upgrade.config.js";
import {
  GetUpgradesResponse,
  PurchaseUpgradeResponse,
  UpgradeDetails,
  UpgradesWithDetails
} from "../types/upgrade.types.js";
import { Transaction } from "../models/Transactions.js";
import { updateAchievementProgress } from "./achievement.service.js";
import { LOGGER } from "../log/logger.js";
export const calculateUpgradeCost = (type: keyof IUpgrades, currentLevel: number): number => {
  const config = UPGRADE_CONFIG[type];
  return Math.floor(config.baseCost * Math.pow(config.costMultiplier, currentLevel));
};

export const calculateUpgradePower = (type: keyof IUpgrades, level: number): number => {
  if (level === 0) return 0;

  const config = UPGRADE_CONFIG[type];

  if (config.powerMultiplier === 1.0) {
    return level;
  }

  return Math.pow(config.powerMultiplier, level) - 1;
};

export const getUpgradeDetails = (
  type: keyof IUpgrades,
  currentLevel: number,
  userCoins: number
): UpgradeDetails => {
  const cost = calculateUpgradeCost(type, currentLevel);
  const power = calculateUpgradePower(type, currentLevel);
  const nextPower = calculateUpgradePower(type, currentLevel + 1);

  return {
    level: currentLevel,
    cost,
    power: power.toFixed(2),
    nextPower: nextPower.toFixed(2),
    canAfford: userCoins >= cost
  };
};

export const getAllUpgrades = (user: IUser): GetUpgradesResponse => {
  const upgrades = UPGRADE_TYPES.reduce((acc, upgradeType) => {
    acc[upgradeType] = getUpgradeDetails(
      upgradeType,
      user.upgrades[upgradeType],
      user.coins
    );
    return acc;
  }, {} as UpgradesWithDetails);

  return {
    upgrades,
    balance: user.coins,
    powerLevel: user.getPowerLevel()
  };
};

export const canPurchaseUpgrade = (user: IUser, type: keyof IUpgrades): {
  canPurchase: boolean;
  reason?: string;
} => {
  const currentLevel = user.upgrades[type];
  const cost = calculateUpgradeCost(type, currentLevel);

  if (user.coins < cost) {
    return {
      canPurchase: false,
      reason: `Insufficient coins. Need ${cost}, have ${user.coins}`
    };
  }

  return { canPurchase: true };
};

const createTransactionRecord = async (
  userId: string,
  upgradeType: keyof IUpgrades,
  fromLevel: number,
  cost: number,
  balanceBefore: number,
  balanceAfter: number
): Promise<void> => {
  await Transaction.create({
    userId,
    type: 'upgrade_purchase',
    currency: 'coins',
    amount: -cost,
    balanceBefore,
    balanceAfter,
    description: `Upgrade ${upgradeType} to level ${fromLevel + 1}`,
    metadata: {
      upgradeType,
      fromLevel,
      toLevel: fromLevel + 1
    }
  });
};


export const purchaseUpgrade = async (
  user: IUser,
  type: keyof IUpgrades
): Promise<PurchaseUpgradeResponse> => {
  const validation = canPurchaseUpgrade(user, type);
  if (!validation.canPurchase) {
    throw new Error(validation.reason || 'Cannot purchase upgrade');
  }

  const currentLevel = user.upgrades[type];
  const cost = calculateUpgradeCost(type, currentLevel);
  const previousCoins = user.coins;

  user.coins -= cost;
  user.upgrades[type] = currentLevel + 1;

  await user.save();

  createTransactionRecord(user._id.toString(), type, currentLevel, cost, previousCoins, user.coins)
    .catch(err => LOGGER.error('Failed to create transaction:', err));

  updateAchievementProgress(user._id.toString(), {
    upgradeType: type,
    upgradeLevel: currentLevel + 1
  }).catch(err => LOGGER.error('Failed to update achievements:', err));

  const newLevel = currentLevel + 1;
  const newPower = calculateUpgradePower(type, newLevel);
  const nextCost = calculateUpgradeCost(type, newLevel);
  const nextPower = calculateUpgradePower(type, newLevel + 1);

  return {
    upgrade: {
      type,
      newLevel,
      power: newPower.toFixed(2),
      nextCost,
      nextPower: nextPower.toFixed(2)
    },
    balance: user.coins,
    powerLevel: user.getPowerLevel()
  };
};
