// Server-side constants

export const GAME_CONSTANTS = {
  // Track
  TRACK_LENGTH: 2000,
  SECTION_COUNT: 10,
  SECTION_LENGTH: 200,
  LANE_COUNT: 3,
  LANE_WIDTH: 3,

  // Player
  BASE_SPEED: 10,
  BASE_JUMP_HEIGHT: 2,
  BASE_MAX_ARMY: 30,
  BASE_STARTING_ARMY: 1,

  // Timing
  GAME_DURATION: 120,
  MATCHMAKING_TIMEOUT: 30,
  RECONNECT_GRACE: 30,

  // Economy
  HOUSE_FEE: 0.1,
  MIN_DEPOSIT: 5,
  MIN_WITHDRAW: 10,
  WITHDRAW_FEE: 0.5,

  // Upgrades
  UPGRADE_COSTS: {
    capacity: 5,
    addWarrior: 50,
    warriorUpgrade: 5,
    income: 5,
    speed: 20,
    jump: 15,
    bulletPower: 30,
    magnetRadius: 25
  } as const,

  MAX_LEVELS: {
    capacity: 20,
    addWarrior: 10,
    warriorUpgrade: 20,
    income: 20,
    speed: 15,
    jump: 10,
    bulletPower: 10,
    magnetRadius: 5
  } as const
};

// Calculate upgrade cost
export function calculateUpgradeCost(type: keyof typeof GAME_CONSTANTS.UPGRADE_COSTS, level: number): number {
  return GAME_CONSTANTS.UPGRADE_COSTS[type] * Math.pow(2, level);
}

// Calculate power level
export function calculatePowerLevel(upgrades: Record<string, number>): number {
  return (
    (upgrades.capacity || 0) * 10 +
    (upgrades.addWarrior || 0) * 20 +
    (upgrades.warriorUpgrade || 0) * 10 +
    (upgrades.income || 0) * 5 +
    (upgrades.speed || 0) * 8 +
    (upgrades.jump || 0) * 6 +
    (upgrades.bulletPower || 0) * 12 +
    (upgrades.magnetRadius || 0) * 5
  );
}

// Score calculation
export function calculateScore(result: {
  distanceTraveled: number;
  coinsCollected: number;
  maxArmy: number;
  timeTaken: number;
  enemiesKilled: number;
  perfectGates: number;
}): number {
  return (
    result.distanceTraveled * 10 +
    result.coinsCollected * 1 +
    result.maxArmy * 10 +
    Math.max(0, (120 - result.timeTaken) * 5) +
    result.enemiesKilled * 20 +
    result.perfectGates * 50
  );
}

// Reward calculation
export function calculateReward(
  result: { coinsCollected: number; maxArmy: number; timeTaken: number; enemiesKilled: number },
  incomeLevel: number
): number {
  const incomeMultiplier = 1 + incomeLevel * 0.15;
  const baseReward = 50 +
    result.coinsCollected +
    result.maxArmy * 2 +
    Math.max(0, (120 - result.timeTaken) * 2) +
    result.enemiesKilled * 5;

  return Math.floor(baseReward * incomeMultiplier);
}
