export type AnimationState = 'idle' | 'walking' | 'jogging' | 'running' | 'sprinting';

export interface CharacterColors {
  skin: string;
  hair: string;
  shirt: string;
  pants: string;
  shoes: string;
  eyeColor: string;
}

export interface BodyScale {
  head: number;
  torso: number;
  arms: number;
  legs: number;
}

export interface CharacterConfig {
  id: string;
  name: string;
  colors: CharacterColors;
  bodyScale: BodyScale;
  hairStyle: 'short' | 'long' | 'bald' | 'mohawk' | 'none';
  gender: 'male' | 'female';
}

export const SKIN_CONFIGS: Record<string, CharacterConfig> = {
  default: {
    id: 'default',
    name: 'Default',
    colors: {
      skin: '#ffcc80',
      hair: '#5d4037',
      shirt: '#4fc3f7',
      pants: '#5c6bc0',
      shoes: '#37474f',
      eyeColor: '#1a1a2e',
    },
    bodyScale: { head: 1, torso: 1, arms: 1, legs: 1 },
    hairStyle: 'short',
    gender: 'male',
  },
  trump: {
    id: 'trump',
    name: 'Trump',
    colors: {
      skin: '#ffd5b5',
      hair: '#ffcc00',
      shirt: '#1a237e',
      pants: '#1a237e',
      shoes: '#000000',
      eyeColor: '#4a90a4',
    },
    bodyScale: { head: 1.1, torso: 1.15, arms: 1, legs: 1 },
    hairStyle: 'short',
    gender: 'male',
  },
  roben: {
    id: 'roben',
    name: 'Roben',
    colors: {
      skin: '#e8b89d',
      hair: '#2c1810',
      shirt: '#4caf50',
      pants: '#333333',
      shoes: '#ffffff',
      eyeColor: '#3e2723',
    },
    bodyScale: { head: 1, torso: 1, arms: 1.05, legs: 1.05 },
    hairStyle: 'short',
    gender: 'male',
  },
  mayan: {
    id: 'mayan',
    name: 'Mayan',
    colors: {
      skin: '#deb887',
      hair: '#1a1a1a',
      shirt: '#e91e63',
      pants: '#7b1fa2',
      shoes: '#ff4081',
      eyeColor: '#4e342e',
    },
    bodyScale: { head: 0.95, torso: 0.9, arms: 0.9, legs: 1 },
    hairStyle: 'long',
    gender: 'female',
  },
};

export function getSkinConfig(skinId: string): CharacterConfig {
  const lowerSkinId = skinId.toLowerCase();
  return SKIN_CONFIGS[lowerSkinId] || SKIN_CONFIGS.default;
}