import { Request, Response } from 'express';
import { User } from '../models/Users.js';

/**
 * Get user settings
 */
export async function getSettings(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    res.json({
      success: true,
      data: user.settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, error: 'Failed to get settings' });
  }
}

/**
 * Update user settings
 */
export async function updateSettings(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const {
      masterVolume,
      musicVolume,
      sfxVolume,
      graphicsQuality,
      showFPS,
      controlSensitivity
    } = req.body;

    // Validate and update settings
    if (masterVolume !== undefined) {
      if (masterVolume < 0 || masterVolume > 1) {
        return res.status(400).json({ success: false, error: 'Master volume must be between 0 and 1' });
      }
      user.settings.masterVolume = masterVolume;
    }

    if (musicVolume !== undefined) {
      if (musicVolume < 0 || musicVolume > 1) {
        return res.status(400).json({ success: false, error: 'Music volume must be between 0 and 1' });
      }
      user.settings.musicVolume = musicVolume;
    }

    if (sfxVolume !== undefined) {
      if (sfxVolume < 0 || sfxVolume > 1) {
        return res.status(400).json({ success: false, error: 'SFX volume must be between 0 and 1' });
      }
      user.settings.sfxVolume = sfxVolume;
    }

    if (graphicsQuality !== undefined) {
      if (!['low', 'medium', 'high'].includes(graphicsQuality)) {
        return res.status(400).json({ success: false, error: 'Invalid graphics quality' });
      }
      user.settings.graphicsQuality = graphicsQuality;
    }

    if (showFPS !== undefined) {
      user.settings.showFPS = Boolean(showFPS);
    }

    if (controlSensitivity !== undefined) {
      if (controlSensitivity < 0 || controlSensitivity > 1) {
        return res.status(400).json({ success: false, error: 'Control sensitivity must be between 0 and 1' });
      }
      user.settings.controlSensitivity = controlSensitivity;
    }

    await user.save();

    res.json({
      success: true,
      data: user.settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
}
