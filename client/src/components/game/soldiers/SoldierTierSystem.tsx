// SoldierTierSystem.tsx - Tiered soldier system for performance
// Shows individual soldiers up to 9, then upgrades every 10

export const MAX_VISIBLE_SOLDIERS = 10;
export const SOLDIERS_PER_UPGRADE = 10; // Every 10 soldiers = 1 upgraded soldier

// Calculate how many levels a soldier has based on total value
export function calculateSoldierLevel(value: number): number {
  if (value <= 1) return 1;
  if (value <= 10) return 2;
  if (value <= 20) return 3;
  if (value <= 30) return 4;
  if (value <= 40) return 5;
  if (value <= 50) return 6;
  if (value <= 60) return 7;
  if (value <= 70) return 8;
  if (value <= 80) return 9;
  if (value <= 90) return 10;
  return Math.min(15, Math.floor(value / 10) + 1);
}

// Calculate total soldier value from displayed soldiers
export function calculateTotalValue(soldiers: TieredSoldier[]): number {
  return soldiers.reduce((sum, s) => sum + s.value, 0);
}

// Distribute soldiers based on count:
// - 1-9 soldiers: show that many individual soldiers (value 1 each)
// - 10 soldiers: show 1 upgraded soldier (value 10)
// - 13 soldiers: show 1 upgraded (value 10) + 3 regular (value 1 each)
// - 25 soldiers: show 2 upgraded (value 10 each) + 5 regular (value 1 each)
export function distributeSoldiers(totalValue: number): TieredSoldier[] {
  if (totalValue <= 0) return [];

  const soldiers: TieredSoldier[] = [];

  // Calculate upgraded soldiers (every 10 soldiers = 1 upgraded)
  const numUpgraded = Math.floor(totalValue / SOLDIERS_PER_UPGRADE);
  // Regular soldiers are the remainder
  const numRegular = totalValue % SOLDIERS_PER_UPGRADE;

  // Add upgraded soldiers (each worth 10)
  for (let i = 0; i < numUpgraded && soldiers.length < MAX_VISIBLE_SOLDIERS; i++) {
    soldiers.push({
      id: i,
      value: 10,
      level: 2, // Upgraded soldier with helmet
    });
  }

  // Add regular soldiers (each worth 1)
  for (let i = 0; i < numRegular && soldiers.length < MAX_VISIBLE_SOLDIERS; i++) {
    soldiers.push({
      id: numUpgraded + i,
      value: 1,
      level: 1, // Basic soldier
    });
  }

  return soldiers;
}

// Soldier data with tier/level info
export interface TieredSoldier {
  id: number;
  value: number;     // How many soldiers this one represents (1-150+)
  level: number;     // Visual level (1-15+)
}

// Visual tier configuration
export interface SoldierTierVisuals {
  level: number;
  minValue: number;
  maxValue: number;
  name: string;
  // Visual enhancements
  hasHelmet: boolean;
  hasArmor: boolean;
  hasCape: boolean;
  hasGlow: boolean;
  glowColor?: string;
  glowIntensity?: number;
  sizeMultiplier: number;
  // Colors
  armorColor?: string;
  capeColor?: string;
  helmetColor?: string;
}

// Define visual tiers
export const SOLDIER_TIERS: SoldierTierVisuals[] = [
  { level: 1, minValue: 1, maxValue: 10, name: 'Recruit',
    hasHelmet: false, hasArmor: false, hasCape: false, hasGlow: false,
    sizeMultiplier: 1.0 },
  { level: 2, minValue: 11, maxValue: 20, name: 'Soldier',
    hasHelmet: true, hasArmor: false, hasCape: false, hasGlow: false,
    sizeMultiplier: 1.0, helmetColor: '#4a4a4a' },
  { level: 3, minValue: 21, maxValue: 30, name: 'Veteran',
    hasHelmet: true, hasArmor: true, hasCape: false, hasGlow: false,
    sizeMultiplier: 1.05, helmetColor: '#5a5a5a', armorColor: '#6a6a6a' },
  { level: 4, minValue: 31, maxValue: 40, name: 'Elite',
    hasHelmet: true, hasArmor: true, hasCape: true, hasGlow: false,
    sizeMultiplier: 1.1, helmetColor: '#3a5a3a', armorColor: '#4a6a4a', capeColor: '#2a4a2a' },
  { level: 5, minValue: 41, maxValue: 50, name: 'Champion',
    hasHelmet: true, hasArmor: true, hasCape: true, hasGlow: true,
    sizeMultiplier: 1.15, helmetColor: '#5a5a8a', armorColor: '#6a6a9a', capeColor: '#4a4a7a',
    glowColor: '#8888ff', glowIntensity: 0.3 },
  { level: 6, minValue: 51, maxValue: 60, name: 'Knight',
    hasHelmet: true, hasArmor: true, hasCape: true, hasGlow: true,
    sizeMultiplier: 1.2, helmetColor: '#8a6a3a', armorColor: '#9a7a4a', capeColor: '#7a5a2a',
    glowColor: '#ffaa44', glowIntensity: 0.4 },
  { level: 7, minValue: 61, maxValue: 70, name: 'Commander',
    hasHelmet: true, hasArmor: true, hasCape: true, hasGlow: true,
    sizeMultiplier: 1.25, helmetColor: '#aa4444', armorColor: '#bb5555', capeColor: '#992222',
    glowColor: '#ff4444', glowIntensity: 0.5 },
  { level: 8, minValue: 71, maxValue: 80, name: 'General',
    hasHelmet: true, hasArmor: true, hasCape: true, hasGlow: true,
    sizeMultiplier: 1.3, helmetColor: '#ccaa44', armorColor: '#ddbb55', capeColor: '#bb9922',
    glowColor: '#ffdd44', glowIntensity: 0.6 },
  { level: 9, minValue: 81, maxValue: 90, name: 'Warlord',
    hasHelmet: true, hasArmor: true, hasCape: true, hasGlow: true,
    sizeMultiplier: 1.35, helmetColor: '#cc44cc', armorColor: '#dd55dd', capeColor: '#aa22aa',
    glowColor: '#ff44ff', glowIntensity: 0.7 },
  { level: 10, minValue: 91, maxValue: 100, name: 'Legend',
    hasHelmet: true, hasArmor: true, hasCape: true, hasGlow: true,
    sizeMultiplier: 1.4, helmetColor: '#44cccc', armorColor: '#55dddd', capeColor: '#22aaaa',
    glowColor: '#44ffff', glowIntensity: 0.8 },
  // Levels 11-15 for very high values
  { level: 11, minValue: 101, maxValue: 110, name: 'Mythic',
    hasHelmet: true, hasArmor: true, hasCape: true, hasGlow: true,
    sizeMultiplier: 1.45, helmetColor: '#ff6600', armorColor: '#ff7722', capeColor: '#ee5500',
    glowColor: '#ff8844', glowIntensity: 0.9 },
  { level: 12, minValue: 111, maxValue: 120, name: 'Immortal',
    hasHelmet: true, hasArmor: true, hasCape: true, hasGlow: true,
    sizeMultiplier: 1.5, helmetColor: '#ffff00', armorColor: '#ffff44', capeColor: '#dddd00',
    glowColor: '#ffff88', glowIntensity: 1.0 },
  { level: 13, minValue: 121, maxValue: 130, name: 'Divine',
    hasHelmet: true, hasArmor: true, hasCape: true, hasGlow: true,
    sizeMultiplier: 1.55, helmetColor: '#ffffff', armorColor: '#ffffff', capeColor: '#eeeeee',
    glowColor: '#ffffff', glowIntensity: 1.2 },
  { level: 14, minValue: 131, maxValue: 140, name: 'Ascended',
    hasHelmet: true, hasArmor: true, hasCape: true, hasGlow: true,
    sizeMultiplier: 1.6, helmetColor: '#ff0000', armorColor: '#ff2222', capeColor: '#dd0000',
    glowColor: '#ff4444', glowIntensity: 1.5 },
  { level: 15, minValue: 141, maxValue: 999999, name: 'God',
    hasHelmet: true, hasArmor: true, hasCape: true, hasGlow: true,
    sizeMultiplier: 1.7, helmetColor: '#ffaa00', armorColor: '#ffcc00', capeColor: '#ff8800',
    glowColor: '#ffdd00', glowIntensity: 2.0 },
];

// Get tier visuals for a given soldier value
export function getSoldierTierVisuals(value: number): SoldierTierVisuals {
  for (const tier of SOLDIER_TIERS) {
    if (value >= tier.minValue && value <= tier.maxValue) {
      return tier;
    }
  }
  // Default to highest tier for very high values
  return SOLDIER_TIERS[SOLDIER_TIERS.length - 1];
}

// Get tier visuals by level
export function getSoldierTierByLevel(level: number): SoldierTierVisuals {
  const clampedLevel = Math.min(Math.max(1, level), 15);
  return SOLDIER_TIERS[clampedLevel - 1];
}
