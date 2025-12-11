// Re-export shared constants
export * from '@shared/types/game.types';

// Client-specific constants
export const CLIENT_CONSTANTS = {
  // API
  API_BASE_URL: import.meta.env.VITE_API_URL || '/api',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || '',

  // Graphics
  CAMERA_FOV: 75,
  CAMERA_NEAR: 0.1,
  CAMERA_FAR: 1000,
  CAMERA_OFFSET: { x: 0, y: 8, z: -12 },

  // Animation
  LANE_SWITCH_DURATION: 0.15,
  JUMP_DURATION: 0.5,
  COLLECT_ANIMATION_DURATION: 0.3,

  // Rendering
  MAX_VISIBLE_DISTANCE: 100,
  OBJECT_POOL_SIZE: 50,

  // UI
  HUD_UPDATE_INTERVAL: 100, // ms
  FLOATING_TEXT_DURATION: 1000,

  // Touch
  MIN_SWIPE_DISTANCE: 30,
  MAX_SWIPE_TIME: 300,

  // Sound (placeholders for future implementation)
  SOUNDS: {
    COIN_COLLECT: 'coin.mp3',
    SOLDIER_ADD: 'soldier.mp3',
    ENEMY_HIT: 'hit.mp3',
    POWERUP: 'powerup.mp3',
    JUMP: 'jump.mp3',
    GAME_OVER: 'gameover.mp3',
    VICTORY: 'victory.mp3'
  }
} as const;

// Color palette for game objects - BRIGHT CASUAL STYLE (Brawl Stars/Subway Surfers)
export const COLORS = {
  // Track - Bright and colorful
  LANE_DEFAULT: '#D2691E',     // Chocolate brown track
  LANE_BORDER: '#8B4513',      // Saddle brown border
  TRACK_GRASS: '#7CFC00',      // Bright lawn green

  // Player - Vibrant blue
  PLAYER_PRIMARY: '#4ECDC4',   // Turquoise
  PLAYER_SECONDARY: '#45B7D1', // Light blue

  // Army - Bright green soldiers
  SOLDIER_COLOR: '#32CD32',    // Lime green
  SOLDIER_HIGHLIGHT: '#98FB98', // Pale green

  // Gates - Vibrant, high saturation colors
  GATE_ADD: '#32CD32',         // Lime green
  GATE_MULTIPLY: '#00BFFF',    // Electric blue
  GATE_SPEED: '#FFD700',       // Gold
  GATE_SHIELD: '#9370DB',      // Medium purple
  GATE_MAGNET: '#FF69B4',      // Hot pink
  GATE_BULLETS: '#DC143C',     // Crimson red

  // Enemies - Bold, warning colors
  ENEMY_STATIC: '#FF6B6B',     // Coral red
  ENEMY_PATROL: '#FF8C00',     // Dark orange
  ENEMY_CHARGER: '#FF4500',    // Orange red
  ENEMY_BOSS: '#8B0000',       // Dark red (menacing)

  // Obstacles
  OBSTACLE_WALL: '#A0522D',    // Sienna (wood-like)
  OBSTACLE_GAP: '#2F4F4F',     // Dark slate gray

  // Coins - Shiny gold
  COIN: '#FFD700',             // Gold
  COIN_GLOW: '#FFF8DC',        // Cornsilk (warm glow)

  // Effects - Bright and punchy
  PARTICLE_EXPLOSION: '#FFD700',
  DAMAGE_FLASH: '#FF6B6B',
  HEAL_FLASH: '#98FB98',

  // Environment - Bright sky and grass
  SKY_TOP: '#87CEEB',          // Sky blue
  SKY_BOTTOM: '#4A90E2',       // Deeper sky blue
  SKY_GRADIENT: 'linear-gradient(180deg, #87CEEB 0%, #4A90E2 100%)',
  GROUND: '#228B22',           // Forest green (grass)
  FOG: '#B0E0E6',              // Powder blue (light fog)

  // UI Colors
  PRIMARY: '#FF6B35',          // Bright orange
  SECONDARY: '#4ECDC4',        // Turquoise
  SUCCESS: '#95E1D3',          // Mint
  WARNING: '#FFE66D',          // Yellow
  DANGER: '#FF6B6B',           // Coral red
  TEXT_WHITE: '#FFFFFF',
  TEXT_OUTLINE: '#000000'
} as const;

// Skins data
export const SKINS = {
  default: {
    id: 'default',
    name: 'Default',
    rarity: 'common' as const,
    price: { coins: 0 },
    colors: {
      primary: '#60a5fa',
      secondary: '#3b82f6'
    }
  },
  fire: {
    id: 'fire',
    name: 'Fire Runner',
    rarity: 'rare' as const,
    price: { coins: 5000 },
    colors: {
      primary: '#ef4444',
      secondary: '#dc2626'
    }
  },
  ice: {
    id: 'ice',
    name: 'Ice Runner',
    rarity: 'rare' as const,
    price: { coins: 5000 },
    colors: {
      primary: '#06b6d4',
      secondary: '#0891b2'
    }
  },
  golden: {
    id: 'golden',
    name: 'Golden Runner',
    rarity: 'epic' as const,
    price: { gems: 300 },
    colors: {
      primary: '#fbbf24',
      secondary: '#f59e0b'
    }
  },
  shadow: {
    id: 'shadow',
    name: 'Shadow Runner',
    rarity: 'epic' as const,
    price: { gems: 400 },
    colors: {
      primary: '#6b7280',
      secondary: '#4b5563'
    }
  },
  cosmic: {
    id: 'cosmic',
    name: 'Cosmic Runner',
    rarity: 'legendary' as const,
    price: { gems: 800 },
    colors: {
      primary: '#8b5cf6',
      secondary: '#7c3aed'
    }
  },
  rainbow: {
    id: 'rainbow',
    name: 'Rainbow Runner',
    rarity: 'legendary' as const,
    price: { gems: 1000 },
    colors: {
      primary: '#ec4899',
      secondary: '#8b5cf6'
    }
  }
} as const;

// Achievement definitions
export const ACHIEVEMENTS = {
  // Gameplay
  FIRST_WIN: {
    id: 'first_win',
    name: 'First Victory',
    description: 'Win your first game',
    reward: { coins: 500 }
  },
  WINS_10: {
    id: 'wins_10',
    name: 'Getting Started',
    description: 'Win 10 games',
    reward: { coins: 1000, gems: 25 }
  },
  WINS_50: {
    id: 'wins_50',
    name: 'Seasoned Runner',
    description: 'Win 50 games',
    reward: { coins: 5000, gems: 100 }
  },
  WINS_100: {
    id: 'wins_100',
    name: 'Master Runner',
    description: 'Win 100 games',
    reward: { coins: 10000, gems: 200 }
  },
  SCORE_10K: {
    id: 'score_10k',
    name: 'High Scorer',
    description: 'Reach 10,000 score in a single game',
    reward: { coins: 1000 }
  },
  SCORE_25K: {
    id: 'score_25k',
    name: 'Score Master',
    description: 'Reach 25,000 score in a single game',
    reward: { coins: 2500, gems: 50 }
  },
  ARMY_50: {
    id: 'army_50',
    name: 'Small Army',
    description: 'Have 50 soldiers at once',
    reward: { coins: 500 }
  },
  ARMY_100: {
    id: 'army_100',
    name: 'Large Army',
    description: 'Have 100 soldiers at once',
    reward: { coins: 2000, gems: 50 }
  },
  PERFECT_RUN: {
    id: 'perfect_run',
    name: 'Flawless',
    description: 'Complete a game without taking damage',
    reward: { coins: 5000, gems: 100 }
  },
  SPEED_RUN: {
    id: 'speed_run',
    name: 'Speed Demon',
    description: 'Complete a game in under 90 seconds',
    reward: { coins: 3000, gems: 75 }
  },

  // Progression
  POWER_100: {
    id: 'power_100',
    name: 'Rising Power',
    description: 'Reach power level 100',
    reward: { coins: 1000 }
  },
  POWER_250: {
    id: 'power_250',
    name: 'Formidable',
    description: 'Reach power level 250',
    reward: { coins: 5000, gems: 100 }
  },
  POWER_500: {
    id: 'power_500',
    name: 'Legendary',
    description: 'Reach power level 500',
    reward: { coins: 10000, gems: 500 }
  },
  MAX_UPGRADE: {
    id: 'max_upgrade',
    name: 'Maximizer',
    description: 'Max out any upgrade',
    reward: { coins: 5000, gems: 100 }
  },
  COLLECT_10K: {
    id: 'collect_10k',
    name: 'Coin Collector',
    description: 'Collect 10,000 coins total',
    reward: { coins: 1000 }
  },
  COLLECT_100K: {
    id: 'collect_100k',
    name: 'Treasure Hunter',
    description: 'Collect 100,000 coins total',
    reward: { coins: 10000, gems: 200 }
  },

  // Social
  REFER_5: {
    id: 'refer_5',
    name: 'Friendly',
    description: 'Refer 5 friends',
    reward: { coins: 2500, gems: 50 }
  },
  TOP_10: {
    id: 'top_10',
    name: 'Leaderboard Star',
    description: 'Reach top 10 on any leaderboard',
    reward: { coins: 5000, gems: 100 }
  },

  // Special
  PLAY_100_DAYS: {
    id: 'play_100_days',
    name: 'Dedicated',
    description: 'Play for 100 days',
    reward: { coins: 10000, gems: 500 }
  },
  WIN_WITH_1: {
    id: 'win_with_1',
    name: 'Last Survivor',
    description: 'Win a game with exactly 1 soldier',
    reward: { coins: 5000, gems: 200 }
  }
} as const;

// Daily mission templates
export const DAILY_MISSIONS = [
  {
    id: 'play_3',
    description: 'Play 3 games',
    target: 3,
    reward: { coins: 200 },
    type: 'games_played'
  },
  {
    id: 'win_betting',
    description: 'Win 1 betting game',
    target: 1,
    reward: { coins: 500 },
    type: 'betting_wins'
  },
  {
    id: 'collect_100',
    description: 'Collect 100 coins',
    target: 100,
    reward: { coins: 150 },
    type: 'coins_collected'
  },
  {
    id: 'defeat_20',
    description: 'Defeat 20 enemies',
    target: 20,
    reward: { coins: 200 },
    type: 'enemies_killed'
  },
  {
    id: 'army_30',
    description: 'Have 30 soldiers at once',
    target: 30,
    reward: { coins: 250 },
    type: 'max_army'
  }
] as const;
