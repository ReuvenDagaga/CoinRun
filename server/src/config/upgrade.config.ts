import { IUpgrades } from "@shared/interface/IUpgrades";
import { UpgradeConfig } from "../types/upgrade.types.js";

/**
 * Upgrade configuration - centralized place for all upgrade settings
 *
 * This separates configuration from business logic, making it easy to:
 * - Adjust balance without touching code
 * - Load from database/config file in the future
 * - Test different configurations
 */
export const UPGRADE_CONFIG: Record<keyof IUpgrades, UpgradeConfig> = {
  // Expensive upgrade - requires strategic investment
  addWarrior: {
    baseCost: 1000,
    costMultiplier: 3.5,  // Very expensive growth!
    powerMultiplier: 1.0   // Linear: +1 soldier per level
  },

  // Cheap upgrades - easy to max out
  warriorUpgrade: {
    baseCost: 5,
    costMultiplier: 1.2,   // Slow growth
    powerMultiplier: 1.1   // Exponential: 10% compound growth
  },

  speed: {
    baseCost: 5,
    costMultiplier: 1.2,   // Slow growth
    powerMultiplier: 1.03  // Exponential: 3% compound growth
  },

  // Moderate upgrades
  capacity: {
    baseCost: 100,
    costMultiplier: 1.5,   // Moderate growth
    powerMultiplier: 1.0   // Linear: +1 capacity per level
  },

  income: {
    baseCost: 10,
    costMultiplier: 1.7,   // Fast growth
    powerMultiplier: 1.1   // Exponential: 10% compound growth
  },

  jump: {
    baseCost: 50,
    costMultiplier: 1.4,   // Moderate growth
    powerMultiplier: 1.05  // Exponential: 5% compound growth
  },

  // Expensive combat upgrades
  power: {
    baseCost: 200,
    costMultiplier: 1.8,   // Fast growth
    powerMultiplier: 1.08  // Exponential: 8% compound growth
  },

  magnet: {
    baseCost: 150,
    costMultiplier: 1.6,   // Moderate-fast growth
    powerMultiplier: 1.04  // Exponential: 4% compound growth
  }
};

/**
 * List of all upgrade types
 */
export const UPGRADE_TYPES: (keyof IUpgrades)[] = [
  'capacity',
  'addWarrior',
  'warriorUpgrade',
  'income',
  'speed',
  'jump',
  'power',
  'magnet'
];
