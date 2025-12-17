// shared/types/game.types.ts

export const GAME_CONSTANTS = {
  // Track - Updated for faster gameplay
  TRACK_LENGTH: 800,          // Changed from 2000 - ~40-60 seconds gameplay
  SECTION_COUNT: 6,           // Changed from 10
  SECTION_LENGTH: 130,        // Changed from 200 - ~8-10 seconds per section

  // New: Free movement track (no lanes)
  TRACK_WIDTH: 10,            // 10m wide track (-5m to +5m)
  TRACK_HALF_WIDTH: 5,        // For bounds checking

  // Legacy lane support (for backward compatibility with track generation)
  LANE_COUNT: 3,
  LANE_WIDTH: 3,

  // Player - Increased speed for faster gameplay
  BASE_SPEED: 50,             // Changed from 10 - 5x faster!
  HORIZONTAL_SPEED: 15,       // New: Horizontal movement speed (m/s)
  BASE_JUMP_HEIGHT: 3,        // Increased for faster gameplay
  BASE_MAX_ARMY: 30,
  BASE_STARTING_ARMY: 1,

  // Timing
  GAME_DURATION: 60,          // Changed from 120 - shorter games
  MATCHMAKING_TIMEOUT: 30,
  RECONNECT_GRACE: 30,

  // Physics
  GRAVITY: 9.8,
  JUMP_FORCE: 15,
  COLLISION_RADIUS: 1,

  // Shooting system
  BULLET_SPEED: 80,           // Bullets travel at 80 m/s
  BULLET_FIRE_RATE: 1,        // 1 bullet per second per soldier
  BASE_BULLET_DAMAGE: 10,     // Base damage per bullet

  // Army formation (snake following)
  SOLDIER_SPACING: 1.5,       // Distance between soldiers
  PATH_RECORD_INTERVAL: 50,   // Record position every 50ms
  SOLDIER_FOLLOW_DELAY: 300,  // Each soldier follows with 300ms delay

  // Networking
  TICK_RATE: 20,
  INTERPOLATION_DELAY: 100,

  // Economy
  HOUSE_FEE: 0.1,
  MIN_DEPOSIT: 5,
  MIN_WITHDRAW: 10,
  WITHDRAW_FEE: 0.5,

  // Upgrades - Base costs for first level (level 0→1)
  UPGRADE_COSTS: {
    capacity: 100,
    addWarrior: 1000,
    warriorUpgrade: 5,
    income: 10,
    speed: 5,
    jump: 50,
    bulletPower: 200,
    magnetRadius: 150
  },

  // Cost growth multipliers
  COST_MULTIPLIERS: {
    capacity: 1.5,
    addWarrior: 3.5,
    warriorUpgrade: 1.2,
    income: 1.7,
    speed: 1.2,
    jump: 1.4,
    bulletPower: 1.8,
    magnetRadius: 1.6
  },

  MAX_LEVELS: {
    capacity: 999,
    addWarrior: 999,
    warriorUpgrade: 999,
    income: 999,
    speed: 999,
    jump: 999,
    bulletPower: 999,
    magnetRadius: 999
  }
} as const;

export enum EnemyType {
  STATIC = 'static',
  PATROL = 'patrol',
  CHARGER = 'charger',
  BOSS = 'boss'
}

export enum GateType {
  ADD = 'add',
  MULTIPLY = 'multiply',
  SPEED = 'speed',
  SHIELD = 'shield',
  MAGNET = 'magnet',
  BULLETS = 'bullets'
}

export enum SectionType {
  INTRO = 'intro',
  EASY = 'easy',
  COMBAT = 'combat',
  PLATFORMING = 'platforming',
  BONUS = 'bonus',
  HARD_COMBAT = 'hard_combat',
  SPEED = 'speed',
  COLLECTION = 'collection',
  GAUNTLET = 'gauntlet',
  FINISH = 'finish'
}

export enum ObstacleType {
  WALL = 'wall',
  GAP = 'gap',
  MOVING_PLATFORM = 'moving_platform'
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface PlayerState {
  id: string;
  position: Vector3;
  lane: number;              // Legacy, kept for compatibility
  horizontalVelocity: number; // -1 (left), 0 (none), 1 (right)
  isJumping: boolean;
  armyCount: number;
  score: number;
  coinsCollected: number;
  distanceTraveled: number;
  activePowerUps: PowerUpState[];
}

export interface PowerUpState {
  type: GateType;
  remainingTime: number;
}

export interface EnemyState {
  id: string;
  type: EnemyType;
  position: Vector3;
  hp: number;
  maxHp: number;
  damage: number;
  reward: number;
  isAlive: boolean;
}

export interface GateState {
  id: string;
  type: GateType;
  position: Vector3;
  value: number;
  upgradeLevel: number;
  isCollected: boolean;
}

export interface ObstacleState {
  id: string;
  type: ObstacleType;
  position: Vector3;
  width: number;
  height: number;
  lane?: number;
}

export interface CoinState {
  id: string;
  position: Vector3;
  value: number;
  isCollected: boolean;
}

export interface TrackSection {
  type: SectionType;
  startZ: number;
  endZ: number;
  enemies: EnemyState[];
  gates: GateState[];
  obstacles: ObstacleState[];
  coins: CoinState[];
}

export interface TrackData {
  seed: string;
  difficulty: number;
  sections: TrackSection[];
  totalLength: number;
}

export interface UserUpgrades {
  capacity: number;
  addWarrior: number;
  warriorUpgrade: number;
  income: number;
  speed: number;
  jump: number;
  bulletPower: number;
  magnetRadius: number;
}

export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  totalDistance: number;
  totalCoinsCollected: number;
  highestArmy: number;
}

export interface GameResult {
  finalScore: number;
  coinsCollected: number;
  maxArmy: number;
  distanceTraveled: number;
  timeTaken: number;
  didFinish: boolean;
  enemiesKilled: number;
  perfectGates: number;
}

export interface MatchState {
  matchId: string;
  gameType: 'solo' | '1v1';
  trackSeed: string;
  players: PlayerState[];
  status: 'waiting' | 'countdown' | 'playing' | 'finished';
  startTime?: number;
  endTime?: number;
  winnerId?: string;
  betAmount?: number;
}

// Input types
export type SwipeDirection = 'left' | 'right' | 'up';

export interface GameInput {
  direction: SwipeDirection;
  timestamp: number;
}

// Socket event types
export interface BettingQueueData {
  betAmount: number;
  powerLevel: number;
}

export interface MatchFoundData {
  matchId: string;
  opponent: {
    username: string;
    powerLevel: number;
    skin: string;
  };
  trackSeed: string;
}

export interface GameUpdateData {
  players: PlayerState[];
  timestamp: number;
}

export interface GameFinishData {
  winnerId: string;
  results: Record<string, GameResult>;
  rewards: Record<string, { coins: number; xp: number }>;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  score: number;
  skin: string;
}

export interface DailyMission {
  id: string;
  description: string;
  target: number;
  current: number;
  reward: { coins?: number; gems?: number };
  completed: boolean;
  claimed: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  reward: { coins?: number; gems?: number; skin?: string };
  unlockedAt?: Date;
}

export interface ShopItem {
  id: string;
  type: 'skin' | 'boost' | 'lootbox';
  name: string;
  description: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  price: { coins?: number; gems?: number };
  imageUrl?: string;
}

// Scoring formula
export function calculateScore(result: GameResult): number {
  return (
    result.distanceTraveled * 10 +
    result.coinsCollected * 1 +
    result.maxArmy * 10 +
    Math.max(0, (120 - result.timeTaken) * 5) +
    result.enemiesKilled * 20 +
    result.perfectGates * 50
  );
}

// Power level calculation
export function calculatePowerLevel(upgrades: UserUpgrades): number {
  return (
    upgrades.capacity * 10 +
    upgrades.addWarrior * 20 +
    upgrades.warriorUpgrade * 10 +
    upgrades.income * 5 +
    upgrades.speed * 8 +
    upgrades.jump * 6 +
    upgrades.bulletPower * 12 +
    upgrades.magnetRadius * 5
  );
}

// Upgrade cost calculation with custom multipliers
// Formula: baseCost × (costMultiplier ^ currentLevel)
export function calculateUpgradeCost(
  upgradeType: keyof UserUpgrades,
  currentLevel: number
): number {
  const baseCost = GAME_CONSTANTS.UPGRADE_COSTS[upgradeType];
  const multiplier = GAME_CONSTANTS.COST_MULTIPLIERS[upgradeType];
  return Math.floor(baseCost * Math.pow(multiplier, currentLevel));
}

// Get starting army based on upgrades
// LINEAR: +1 soldier per level
export function getStartingArmy(addWarriorLevel: number): number {
  return GAME_CONSTANTS.BASE_STARTING_ARMY + addWarriorLevel;
}

// Get max army based on upgrades
// LINEAR: +1 capacity per level
export function getMaxArmy(capacityLevel: number): number {
  return GAME_CONSTANTS.BASE_MAX_ARMY + capacityLevel;
}

// Get player speed based on upgrades
// EXPONENTIAL: 3% compound growth per level (1.03^level)
export function getPlayerSpeed(speedLevel: number): number {
  return GAME_CONSTANTS.BASE_SPEED * Math.pow(1.03, speedLevel);
}

// Get jump height based on upgrades
// EXPONENTIAL: 5% compound growth per level (1.05^level)
export function getJumpHeight(jumpLevel: number): number {
  return GAME_CONSTANTS.BASE_JUMP_HEIGHT * Math.pow(1.05, jumpLevel);
}

// Get warrior damage multiplier
// EXPONENTIAL: 10% compound growth per level (1.1^level)
export function getWarriorDamage(warriorUpgradeLevel: number): number {
  return Math.pow(1.1, warriorUpgradeLevel);
}

// Get income multiplier
// EXPONENTIAL: 10% compound growth per level (1.1^level)
export function getIncomeMultiplier(incomeLevel: number): number {
  return Math.pow(1.1, incomeLevel);
}

// Get bullet damage multiplier
// EXPONENTIAL: 8% compound growth per level (1.08^level)
export function getBulletDamage(bulletPowerLevel: number): number {
  return 10 * Math.pow(1.08, bulletPowerLevel);
}

// Get magnet radius
// EXPONENTIAL: 4% compound growth per level (1.04^level)
export function getMagnetRadius(magnetRadiusLevel: number): number {
  return 2 * Math.pow(1.04, magnetRadiusLevel);
}

// ==========================================
// END GAME / STAIRS SYSTEM TYPES
// ==========================================

// Stair configuration constants
export const STAIR_CONSTANTS = {
  TOTAL_STAIRS: 10,
  BASE_SPEED: 8,
  SPEED_PER_LEVEL: 1.5,

  // Soldiers required to pass each stair (cumulative cost)
  STAIR_COSTS: [1, 2, 4, 8, 16, 32, 64, 128, 256, 512] as const,

  // Rewards per stair
  DIAMONDS_PER_STAIR: 1,

  // Coin multiplier: 1.0 + (stairIndex + 1) * 0.1
  // Stair 1 = 1.1x, Stair 10 = 2.0x
  COIN_MULTIPLIER_BASE: 1.0,
  COIN_MULTIPLIER_PER_STAIR: 0.1,

  // Stair dimensions
  STAIR_WIDTH: 10,
  STAIR_DEPTH: 3,
  STAIR_HEIGHT: 1.5,
  STAIR_GAP: 2,

  // Position after finish gate
  STAIRS_START_Z: 2010,
} as const;

// End game phase states
export type EndGamePhase =
  | 'approaching'     // Player approaching finish gate
  | 'entering'        // Player passing through finish gate
  | 'climbing'        // Player climbing stairs
  | 'finished'        // Player reached final stair position
  | 'rewards';        // Showing rewards screen

// Individual stair data
export interface StairData {
  index: number;           // 0-9
  position: Vector3;       // World position of stair
  soldiersRequired: number; // Cost to pass this stair
  soldiersOnStair: number; // Soldiers left on this stair
  isReached: boolean;      // Whether player has reached this stair
  isPassed: boolean;       // Whether player has passed this stair
}

// End game state
export interface EndGameState {
  phase: EndGamePhase;
  currentStair: number;           // Current stair index (-1 if not started)
  finalStair: number;             // Highest stair reached
  stairs: StairData[];            // All stair data
  soldiersRemaining: number;      // Soldiers still with player

  // Camera state
  cameraTarget: Vector3;
  cameraPosition: Vector3;
  cameraTransitionProgress: number;

  // Confetti state
  confettiIntensity: number;      // 0-1, increases with stairs

  // Rewards
  diamondsEarned: number;
  coinMultiplier: number;
}

// Rewards breakdown for end screen
export interface GameRewardsBreakdown {
  // Base coins from gameplay
  coinsCollected: number;

  // Income upgrade multiplier
  incomeMultiplier: number;

  // Stair bonus multiplier
  stairMultiplier: number;

  // Final calculations
  coinsAfterIncome: number;       // coinsCollected * incomeMultiplier
  finalCoins: number;             // coinsAfterIncome * stairMultiplier

  // Diamonds from stairs
  diamondsEarned: number;
  stairsReached: number;

  // Whether this is a victory (reached finish gate)
  isVictory: boolean;
}

// Extended game result with end game data
export interface ExtendedGameResult extends GameResult {
  endGameState?: EndGameState;
  rewards?: GameRewardsBreakdown;
}

// Calculate stair coin multiplier
export function getStairCoinMultiplier(stairsReached: number): number {
  return STAIR_CONSTANTS.COIN_MULTIPLIER_BASE +
         (stairsReached * STAIR_CONSTANTS.COIN_MULTIPLIER_PER_STAIR);
}

// Calculate diamonds earned from stairs
export function getStairDiamonds(stairsReached: number): number {
  return stairsReached * STAIR_CONSTANTS.DIAMONDS_PER_STAIR;
}

// Calculate final coins with all multipliers
export function calculateFinalCoins(
  coinsCollected: number,
  incomeLevel: number,
  stairsReached: number
): number {
  const incomeMultiplier = getIncomeMultiplier(incomeLevel);
  const stairMultiplier = getStairCoinMultiplier(stairsReached);
  return Math.floor(coinsCollected * incomeMultiplier * stairMultiplier);
}

// Calculate which stair the player can reach with given soldiers
export function calculateMaxStair(totalSoldiers: number): number {
  let remainingSoldiers = totalSoldiers;
  let maxStair = 0;

  for (let i = 0; i < STAIR_CONSTANTS.TOTAL_STAIRS; i++) {
    if (remainingSoldiers >= STAIR_CONSTANTS.STAIR_COSTS[i]) {
      remainingSoldiers -= STAIR_CONSTANTS.STAIR_COSTS[i];
      maxStair = i + 1;
    } else {
      break;
    }
  }

  return maxStair;
}

// Calculate player speed from upgrades
export function getPlayerSpeedFromUpgrades(speedLevel: number): number {
  return STAIR_CONSTANTS.BASE_SPEED + (speedLevel * STAIR_CONSTANTS.SPEED_PER_LEVEL);
}
