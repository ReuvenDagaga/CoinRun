import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import TextWithShadow from '@/components/TextWithShadow';
import Settings from '../Settings';

export default function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);

  if (!user) return null;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <div
              className="flex items-center bg-gray-900/70 backdrop-blur-sm rounded-full px-2.5 py-1 cursor-pointer hover:bg-gray-800/80 transition-colors"
              onClick={() => navigate('/shop')}
            >
              <img src="/ui/Coin.Png" alt="Coins" className="w-5 h-5 mr-1.5" />
              <TextWithShadow as="span" className="text-sm font-bold text-yellow-400">
                {user.coins.toLocaleString()}
              </TextWithShadow>
              <span className="ml-1.5 w-4 h-4 flex items-center justify-center bg-green-500 rounded-full text-white text-[10px] font-bold">+</span>
            </div>
            <div
              className="flex items-center bg-gray-900/70 backdrop-blur-sm rounded-full px-2.5 py-1 cursor-pointer hover:bg-gray-800/80 transition-colors"
              onClick={() => navigate('/shop')}
            >
              <img src="/ui/Gem.Png" alt="Gems" className="w-5 h-5 mr-1.5" />
              <TextWithShadow as="span" className="text-sm font-bold text-purple-400">
                {user.gems.toLocaleString()}
              </TextWithShadow>
              <span className="ml-1.5 w-4 h-4 flex items-center justify-center bg-green-500 rounded-full text-white text-[10px] font-bold">+</span>
            </div>
          </div>

          <button
            className="w-9 h-9 flex items-center justify-center hover:scale-110 transition-transform pointer-events-auto"
            onClick={() => setShowSettings(true)}
          >
            <img src="/ui/Settings.Png" alt="Settings" className="w-6 h-6 drop-shadow-lg" />
          </button>
        </div>
      </header>

      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
}
