export type AnimationState = 'idle' | 'walking' | 'jogging' | 'running' | 'sprinting';

export interface SkinConfig {
  id: string;
  name: string;
  texturePath: string;
}

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
  colors: CharacterColors;
  bodyScale: BodyScale;
  hairStyle: 'short' | 'long' | 'none';
  gender: 'male' | 'female';
}

export const SKINS: Record<string, SkinConfig> = {
  trump: {
    id: 'trump',
    name: 'Trump',
    texturePath: '/textures/trump_texture.png',
  },
  default: {
    id: 'default',
    name: 'Default',
    texturePath: '/textures/trump_texture.png',
  },
};

export const ANIMATION_NAMES: Record<AnimationState, string> = {
  idle: 'Axe_Stance',
  walking: 'Walking',
  jogging: 'Running',
  running: 'Running',
  sprinting: 'RunFast',
};

export function getAnimationFromSpeed(speedMultiplier: number): AnimationState {
  if (speedMultiplier <= 0.3) return 'idle';
  if (speedMultiplier <= 0.5) return 'walking';
  if (speedMultiplier <= 0.75) return 'jogging';
  if (speedMultiplier <= 1.25) return 'running';
  return 'sprinting';
}

export const DEFAULT_CHARACTER_CONFIG: CharacterConfig = {
  colors: {
    skin: '#FFD5B5',
    hair: '#8B4513',
    shirt: '#4A90D9',
    pants: '#2C3E50',
    shoes: '#1A1A2E',
    eyeColor: '#4A4A4A',
  },
  bodyScale: {
    head: 1,
    torso: 1,
    arms: 1,
    legs: 1,
  },
  hairStyle: 'short',
  gender: 'male',
};