import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import BasePopup from '@/components/ui/BasePopup';
import TextWithShadow from '@/components/TextWithShadow';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Settings({ isOpen, onClose }: SettingsProps) {
  const { user, updateUser, logout } = useAuth();

  const [settings, setSettings] = useState({
    masterVolume: user?.settings?.masterVolume ?? 0.7,
    musicVolume: user?.settings?.musicVolume ?? 0.5,
    sfxVolume: user?.settings?.sfxVolume ?? 0.8,
    graphicsQuality: user?.settings?.graphicsQuality ?? 'medium',
    showFPS: user?.settings?.showFPS ?? false,
  });

  useEffect(() => {
    if (user?.settings) {
      setSettings({
        masterVolume: user.settings.masterVolume ?? 0.7,
        musicVolume: user.settings.musicVolume ?? 0.5,
        sfxVolume: user.settings.sfxVolume ?? 0.8,
        graphicsQuality: user.settings.graphicsQuality ?? 'medium',
        showFPS: user.settings.showFPS ?? false,
      });
    }
  }, [user?.settings]);

  const handleSave = async () => {
    await updateUser({
      settings: {
        ...settings,
        controlSensitivity: user?.settings?.controlSensitivity ?? 0.6
      }
    });
    onClose();
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <BasePopup
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      headerColor="from-sky-500 via-cyan-400 to-sky-400"
      size="lg"
    >
      <div className="p-4 space-y-4">
        {/* Volume Controls */}
        <div className="space-y-3">
          <label className="block">
            <TextWithShadow as="span" className="text-sm text-white mb-1 block">
              Master Volume
            </TextWithShadow>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.masterVolume}
              onChange={(e) => setSettings({ ...settings, masterVolume: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-gray-300 text-xs">{Math.round(settings.masterVolume * 100)}%</span>
          </label>

          <label className="block">
            <TextWithShadow as="span" className="text-sm text-white  mb-1 block">
              Music Volume
            </TextWithShadow>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.musicVolume}
              onChange={(e) => setSettings({ ...settings, musicVolume: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-gray-300 text-xs">{Math.round(settings.musicVolume * 100)}%</span>
          </label>

          <label className="block">
            <TextWithShadow as="span" className="text-sm text-white  mb-1 block">
              SFX Volume
            </TextWithShadow>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.sfxVolume}
              onChange={(e) => setSettings({ ...settings, sfxVolume: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-gray-300 text-xs">{Math.round(settings.sfxVolume * 100)}%</span>
          </label>

          <label className="block">
            <TextWithShadow as="span" className="text-sm text-white  mb-1 block">
              Graphics Quality
            </TextWithShadow>
            <select
              value={settings.graphicsQuality}
              onChange={(e) => setSettings({ ...settings, graphicsQuality: e.target.value as 'low' | 'medium' | 'high' })}
              className="w-full bg-gray-700 text-white text-sm rounded-lg px-3 py-2 border border-gray-600 focus:border-cyan-400 focus:outline-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>

          <label className="flex items-center justify-between py-1">
            <TextWithShadow as="span" className="text-sm text-white ">
              Show FPS
            </TextWithShadow>
            <button
              onClick={() => setSettings({ ...settings, showFPS: !settings.showFPS })}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.showFPS ? 'bg-cyan-500' : 'bg-gray-600'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform mx-0.5 ${
                settings.showFPS ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold rounded-xl transition-colors"
          >
            <TextWithShadow as="span">Cancel</TextWithShadow>
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-cyan-500/30"
          >
            <TextWithShadow as="span">Save</TextWithShadow>
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-red-500/30"
        >
          <TextWithShadow as="span">Logout</TextWithShadow>
        </button>
      </div>
    </BasePopup>
  );
}
