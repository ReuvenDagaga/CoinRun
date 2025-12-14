import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const textShadow = '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000';

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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-[90%] max-w-md bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl border-2 border-cyan-500/50 shadow-2xl shadow-cyan-500/20 overflow-hidden">
        <div className="bg-gradient-to-r from-sky-500 via-cyan-400 to-sky-400 px-6 py-5">
          <h2 
            className="text-3xl font-bold text-white text-center"
            style={{ textShadow }}
          >
            Settings
          </h2>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-5">
            <label className="block">
              <span 
                className="text-lg text-white font-semibold mb-2 block"
                style={{ textShadow }}
              >
                Master Volume
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.masterVolume}
                onChange={(e) => setSettings({ ...settings, masterVolume: parseFloat(e.target.value) })}
                className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <span className="text-gray-300 text-base">{Math.round(settings.masterVolume * 100)}%</span>
            </label>

            <label className="block">
              <span 
                className="text-lg text-white font-semibold mb-2 block"
                style={{ textShadow }}
              >
                Music Volume
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.musicVolume}
                onChange={(e) => setSettings({ ...settings, musicVolume: parseFloat(e.target.value) })}
                className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <span className="text-gray-300 text-base">{Math.round(settings.musicVolume * 100)}%</span>
            </label>

            <label className="block">
              <span 
                className="text-lg text-white font-semibold mb-2 block"
                style={{ textShadow }}
              >
                SFX Volume
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.sfxVolume}
                onChange={(e) => setSettings({ ...settings, sfxVolume: parseFloat(e.target.value) })}
                className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <span className="text-gray-300 text-base">{Math.round(settings.sfxVolume * 100)}%</span>
            </label>

            <label className="block">
              <span 
                className="text-lg text-white font-semibold mb-2 block"
                style={{ textShadow }}
              >
                Graphics Quality
              </span>
              <select
                value={settings.graphicsQuality}
                onChange={(e) => setSettings({ ...settings, graphicsQuality: e.target.value as 'low' | 'medium' | 'high' })}
                className="w-full bg-gray-700 text-white text-lg rounded-lg px-4 py-3 border border-gray-600 focus:border-cyan-400 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>

            <label className="flex items-center justify-between">
              <span 
                className="text-lg text-white font-semibold"
                style={{ textShadow }}
              >
                Show FPS
              </span>
              <button
                onClick={() => setSettings({ ...settings, showFPS: !settings.showFPS })}
                className={`w-16 h-9 rounded-full transition-colors ${
                  settings.showFPS ? 'bg-cyan-500' : 'bg-gray-600'
                }`}
              >
                <div className={`w-7 h-7 bg-white rounded-full shadow-md transform transition-transform mx-1 ${
                  settings.showFPS ? 'translate-x-7' : 'translate-x-0'
                }`} />
              </button>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-4 bg-gray-700 hover:bg-gray-600 text-white text-xl font-bold rounded-xl transition-colors"
              style={{ textShadow }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-white text-xl font-bold rounded-xl transition-colors shadow-lg shadow-cyan-500/30"
              style={{ textShadow }}
            >
              Save
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-xl font-bold rounded-xl transition-colors shadow-lg shadow-red-500/30"
            style={{ textShadow }}
          >
            Logout
          </button>
        </div>

        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center hover:scale-110 transition-transform"
        >
          <img src="/ui/Close.Png" alt="Close" className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}