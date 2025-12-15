import { IUser } from "@shared/interface/IUser";
import { LOGGER } from "../log/logger.js";

export const getUserSettings = (user: IUser) => {
  return user.settings;
};

const validateVolume = (value: number): boolean => {
  return value >= 0 && value <= 1;
};

const validateGraphicsQuality = (value: string): boolean => {
  return ['low', 'medium', 'high'].includes(value);
};

const validateSensitivity = (value: number): boolean => {
  return value >= 0 && value <= 1;
};

export const updateUserSettings = async (user: IUser, updates: {
  masterVolume?: number;
  musicVolume?: number;
  sfxVolume?: number;
  graphicsQuality?: string;
  showFPS?: boolean;
  controlSensitivity?: number;
}) => {
  const { masterVolume, musicVolume, sfxVolume, graphicsQuality, showFPS, controlSensitivity } = updates;

  if (masterVolume !== undefined) {
    if (!validateVolume(masterVolume)) {
      throw new Error('Master volume must be between 0 and 1');
    }
    user.settings.masterVolume = masterVolume;
  }

  if (musicVolume !== undefined) {
    if (!validateVolume(musicVolume)) {
      throw new Error('Music volume must be between 0 and 1');
    }
    user.settings.musicVolume = musicVolume;
  }

  if (sfxVolume !== undefined) {
    if (!validateVolume(sfxVolume)) {
      throw new Error('SFX volume must be between 0 and 1');
    }
    user.settings.sfxVolume = sfxVolume;
  }

  if (graphicsQuality !== undefined) {
    if (!validateGraphicsQuality(graphicsQuality)) {
      throw new Error('Invalid graphics quality');
    }
    user.settings.graphicsQuality = graphicsQuality as 'low' | 'medium' | 'high';
  }

  if (showFPS !== undefined) {
    user.settings.showFPS = Boolean(showFPS);
  }

  if (controlSensitivity !== undefined) {
    if (!validateSensitivity(controlSensitivity)) {
      throw new Error('Control sensitivity must be between 0 and 1');
    }
    user.settings.controlSensitivity = controlSensitivity;
  }

  await user.save();

  LOGGER.info(`User ${user._id} updated settings`);

  return user.settings;
};
