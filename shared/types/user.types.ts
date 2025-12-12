/**
 * SINGLE SOURCE OF TRUTH - User Type Definitions
 *
 * This file defines the complete User model structure.
 * ALL parts of the application (frontend and backend) MUST use these types.
 *
 * DO NOT create alternative user interfaces elsewhere.
 * DO NOT add fields that aren't defined here.
 *
 * If you need to add a field, add it HERE and update the backend model.
 */

// ============================================================================
// SUB-INTERFACES (nested objects in User model)
// ============================================================================

export interface UserUpgrades {
  capacity: number;        // Army capacity (infinite levels)
  addWarrior: number;      // Starting army size (infinite levels)
  warriorUpgrade: number;  // Warrior power (infinite levels)
  income: number;          // Coin value multiplier (infinite levels)
  speed: number;           // Movement speed (infinite levels)
  jump: number;            // Jump height (infinite levels)
  bulletPower: number;     // Bullet damage (infinite levels)
  magnetRadius: number;    // Coin magnet radius (infinite levels)
}

export interface Mission {
  missionId: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

export interface UserSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  graphicsQuality: 'low' | 'medium' | 'high';
  showFPS: boolean;
  controlSensitivity: number;
}

export interface ActiveBoost {
  boostId: string;
  expiresAt: Date | string; // Date on backend, string when serialized to JSON
}

export interface UserAchievement {
  achievementId: string;
  progress: number;
  unlocked: boolean;
  unlockedAt?: Date | string;
}

export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  totalDistance: number;
  totalCoinsCollected: number;
  highestArmy: number;
  bestScore: number; // Added - was missing in frontend types
}

// ============================================================================
// FULL USER MODEL (matches backend IUser)
// ============================================================================

/**
 * Complete User model - matches backend MongoDB schema exactly
 * This is what's stored in the database
 */
export interface User {
  id: string; // MongoDB _id converted to string

  // Basic Info (Google OAuth required)
  username: string;
  email: string;
  googleId: string;
  avatar?: string;

  // Balances (VIRTUAL CURRENCIES ONLY - NO CRYPTO)
  coins: number;
  gems: number;

  // Stats
  gamesPlayed: number;
  gamesWon: number;
  totalDistance: number;
  totalCoinsCollected: number;
  highestArmy: number;
  bestScore: number;

  // Upgrades (INFINITE LEVELS - no max)
  upgrades: UserUpgrades;

  // Missions
  dailyMissions: Mission[];
  weeklyMissions: Mission[];
  lastDailyReset?: Date | string;
  lastWeeklyReset?: Date | string;

  // Achievements
  achievements: UserAchievement[];

  // Shop & Customization
  currentSkin: string;
  ownedSkins: string[];
  activeBoosts: ActiveBoost[];

  // Settings
  settings: UserSettings;

  // Social (Future feature)
  friends: string[]; // Array of user IDs
  referralCode: string;
  referredBy?: string;

  // Timestamps
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Basic user data returned by some endpoints
 * This is a SUBSET of the full User model
 */
export interface BasicUserResponse {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  coins: number;
  gems: number;
}

/**
 * Full user data returned by auth endpoints
 * This is what you get from /api/auth/google and /api/auth/me
 */
export interface FullUserResponse {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  coins: number;
  gems: number;
  upgrades: UserUpgrades;
  stats: UserStats;
  currentSkin: string;
  ownedSkins: string[];
  settings: UserSettings;
  dailyMissions: Mission[];
  weeklyMissions: Mission[];
  achievements: UserAchievement[];
  activeBoosts: ActiveBoost[];
}

/**
 * Type guard to check if a response is a full user response
 */
export function isFullUserResponse(user: any): user is FullUserResponse {
  return (
    user &&
    typeof user.id === 'string' &&
    typeof user.username === 'string' &&
    typeof user.email === 'string' &&
    typeof user.coins === 'number' &&
    typeof user.gems === 'number' &&
    user.upgrades !== undefined &&
    user.stats !== undefined &&
    user.settings !== undefined
  );
}

/**
 * Type guard to check if a response is a basic user response
 */
export function isBasicUserResponse(user: any): user is BasicUserResponse {
  return (
    user &&
    typeof user.id === 'string' &&
    typeof user.username === 'string' &&
    typeof user.email === 'string' &&
    typeof user.coins === 'number' &&
    typeof user.gems === 'number'
  );
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * User data update - partial user for PATCH operations
 */
export type UserUpdate = Partial<Omit<User, 'id' | 'googleId' | 'createdAt' | 'updatedAt'>>;

/**
 * Fields that can be publicly visible on leaderboards, profiles, etc.
 */
export interface PublicUserProfile {
  id: string;
  username: string;
  avatar?: string;
  currentSkin: string;
  stats: UserStats;
}
