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
