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
