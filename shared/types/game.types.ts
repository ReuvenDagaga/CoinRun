// shared/types/game.types.ts

export const GAME_CONSTANTS = {
  // Track - Updated for faster gameplay
  TRACK_LENGTH: 800,          // Changed from 2000 - ~40-60 seconds gameplay
  SECTION_COUNT: 6,           // Changed from 10
  SECTION_LENGTH: 130,        // Changed from 200 - ~8-10 seconds per section
  LANE_COUNT: 3,
  LANE_WIDTH: 3,

  // Player - Increased speed for faster gameplay
  BASE_SPEED: 50,             // Changed from 10 - 5x faster!
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

  // Networking
  TICK_RATE: 20,
  INTERPOLATION_DELAY: 100,

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
  },

  MAX_LEVELS: {
    capacity: 20,
    addWarrior: 10,
    warriorUpgrade: 20,
    income: 20,
    speed: 15,
    jump: 10,
    bulletPower: 10,
    magnetRadius: 5
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
  lane: number;
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

// Upgrade cost calculation
export function calculateUpgradeCost(
  upgradeType: keyof UserUpgrades,
  currentLevel: number
): number {
  const baseCost = GAME_CONSTANTS.UPGRADE_COSTS[upgradeType];
  return baseCost * Math.pow(2, currentLevel);
}

// Get starting army based on upgrades
export function getStartingArmy(addWarriorLevel: number): number {
  return GAME_CONSTANTS.BASE_STARTING_ARMY + addWarriorLevel * 2;
}

// Get max army based on upgrades
export function getMaxArmy(capacityLevel: number): number {
  return GAME_CONSTANTS.BASE_MAX_ARMY + capacityLevel * 5;
}

// Get player speed based on upgrades
export function getPlayerSpeed(speedLevel: number): number {
  return GAME_CONSTANTS.BASE_SPEED * (1 + speedLevel * 0.02);
}

// Get jump height based on upgrades
export function getJumpHeight(jumpLevel: number): number {
  return GAME_CONSTANTS.BASE_JUMP_HEIGHT * (1 + jumpLevel * 0.05);
}

// Get warrior damage multiplier
export function getWarriorDamage(warriorUpgradeLevel: number): number {
  return 1.0 + warriorUpgradeLevel * 0.1;
}

// Get income multiplier
export function getIncomeMultiplier(incomeLevel: number): number {
  return 1.0 + incomeLevel * 0.15;
}

// Get bullet damage multiplier
export function getBulletDamage(bulletPowerLevel: number): number {
  return 10 * (1 + bulletPowerLevel * 0.1);
}

// Get magnet radius
export function getMagnetRadius(magnetRadiusLevel: number): number {
  return 2 + magnetRadiusLevel * 1;
}
