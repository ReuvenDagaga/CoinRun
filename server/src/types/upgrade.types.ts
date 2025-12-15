import { IUpgrades } from "@shared/interface/IUpgrades";

/**
 * Upgrade configuration with costs and power multipliers
 */
export interface UpgradeConfig {
  baseCost: number;
  costMultiplier: number;
  powerMultiplier: number;
}

/**
 * Calculated upgrade details for a specific level
 */
export interface UpgradeDetails {
  level: number;
  cost: number;
  power: string;
  nextPower: string;
  canAfford: boolean;
}

/**
 * All upgrades with their details
 */
export type UpgradesWithDetails = Record<keyof IUpgrades, UpgradeDetails>;

/**
 * Response data for getUpgrades endpoint
 */
export interface GetUpgradesResponse {
  upgrades: UpgradesWithDetails;
  balance: number;
  powerLevel: number;
}

/**
 * Response data for purchaseUpgrade endpoint
 */
export interface PurchaseUpgradeResponse {
  upgrade: {
    type: keyof IUpgrades;
    newLevel: number;
    power: string;
    nextCost: number;
    nextPower: string;
  };
  balance: number;
  powerLevel: number;
}
