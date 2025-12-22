// Weapon system types and configuration
// 10 weapon tiers based on power upgrade level

export type WeaponTier = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface WeaponConfig {
  tier: WeaponTier;
  name: string;
  modelPath: string | null; // null means use procedural model
  scale: number;
  fireRate: number; // bullets per second
  bulletSpeed: number; // multiplier of player speed
  bulletSize: number;
  bulletColor: string;
  muzzleFlashColor: string;
  damage: number;
}

// Get weapon tier from power level (1-10 = tier 1, 11-20 = tier 2, etc.)
export function getWeaponTier(powerLevel: number): WeaponTier {
  const tier = Math.min(10, Math.max(1, Math.ceil(powerLevel / 10))) as WeaponTier;
  return tier || 1;
}

// Weapon configurations for all 10 tiers
// Only tier 1 (Pistol) is fully implemented now
export const WEAPON_CONFIGS: Record<WeaponTier, WeaponConfig> = {
  1: {
    tier: 1,
    name: 'Pistol',
    modelPath: '/models/weapons/pistol.glb', // Will fallback to procedural if not found
    scale: 0.15,
    fireRate: 1, // 1 bullet per second
    bulletSpeed: 2.5, // 2.5x player speed
    bulletSize: 0.08,
    bulletColor: '#FFD700', // Gold
    muzzleFlashColor: '#FF8800',
    damage: 1,
  },
  2: {
    tier: 2,
    name: 'Revolver',
    modelPath: null,
    scale: 0.16,
    fireRate: 1.2,
    bulletSpeed: 2.6,
    bulletSize: 0.09,
    bulletColor: '#FFA500',
    muzzleFlashColor: '#FF6600',
    damage: 1.5,
  },
  3: {
    tier: 3,
    name: 'SMG',
    modelPath: null,
    scale: 0.18,
    fireRate: 1.5,
    bulletSpeed: 2.7,
    bulletSize: 0.07,
    bulletColor: '#00FF88',
    muzzleFlashColor: '#00CC66',
    damage: 1.2,
  },
  4: {
    tier: 4,
    name: 'Rifle',
    modelPath: null,
    scale: 0.22,
    fireRate: 1.3,
    bulletSpeed: 3.0,
    bulletSize: 0.1,
    bulletColor: '#00DDFF',
    muzzleFlashColor: '#0099CC',
    damage: 2,
  },
  5: {
    tier: 5,
    name: 'Shotgun',
    modelPath: null,
    scale: 0.25,
    fireRate: 0.8,
    bulletSpeed: 2.8,
    bulletSize: 0.12,
    bulletColor: '#FF4444',
    muzzleFlashColor: '#CC2222',
    damage: 3,
  },
  6: {
    tier: 6,
    name: 'Assault Rifle',
    modelPath: null,
    scale: 0.24,
    fireRate: 2.0,
    bulletSpeed: 3.2,
    bulletSize: 0.08,
    bulletColor: '#9966FF',
    muzzleFlashColor: '#7744CC',
    damage: 2.5,
  },
  7: {
    tier: 7,
    name: 'Sniper',
    modelPath: null,
    scale: 0.3,
    fireRate: 0.5,
    bulletSpeed: 4.0,
    bulletSize: 0.15,
    bulletColor: '#FF00FF',
    muzzleFlashColor: '#CC00CC',
    damage: 5,
  },
  8: {
    tier: 8,
    name: 'Minigun',
    modelPath: null,
    scale: 0.35,
    fireRate: 3.0,
    bulletSpeed: 3.0,
    bulletSize: 0.06,
    bulletColor: '#FFFF00',
    muzzleFlashColor: '#CCCC00',
    damage: 1.5,
  },
  9: {
    tier: 9,
    name: 'Plasma Rifle',
    modelPath: null,
    scale: 0.28,
    fireRate: 1.5,
    bulletSpeed: 3.5,
    bulletSize: 0.12,
    bulletColor: '#00FFFF',
    muzzleFlashColor: '#00CCCC',
    damage: 4,
  },
  10: {
    tier: 10,
    name: 'Laser Cannon',
    modelPath: null,
    scale: 0.4,
    fireRate: 1.0,
    bulletSpeed: 5.0,
    bulletSize: 0.2,
    bulletColor: '#FF0000',
    muzzleFlashColor: '#FF4400',
    damage: 10,
  },
};

// Bullet data structure
export interface BulletData {
  id: string;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  damage: number;
  size: number;
  color: string;
  sourceIndex: number; // Which soldier fired it (-1 for player)
  createdAt: number;
}

// Constants
export const BULLET_LIFETIME = 3000; // 3 seconds max lifetime
export const BULLET_Y_OFFSET = 0.8; // Height at which bullets are fired
