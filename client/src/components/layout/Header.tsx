// components/layout/Header.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Settings from '../Settings';

export default function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);

  if (!user) return null;

  return (
    <>
      <header className="relative h-16">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-2">
            <div 
              className="flex items-center bg-gray-800/80 rounded-full px-3 py-1.5 border border-gray-700 cursor-pointer hover:bg-gray-700/80 transition-colors"
              onClick={() => navigate('/shop')}
            >
              <img src="/ui/Coin.Png" alt="Coins" className="w-6 h-6 mr-2" />
              <span 
                className="text-base font-bold text-yellow-400"
                style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}
              >
                {user.coins.toLocaleString()}
              </span>
              <span className="ml-2 w-4 h-4 flex items-center justify-center bg-green-500 rounded-full text-white text-xs font-bold">+</span>
            </div>
            <div 
              className="flex items-center bg-gray-800/80 rounded-full px-3 py-1.5 border border-gray-700 cursor-pointer hover:bg-gray-700/80 transition-colors"
              onClick={() => navigate('/shop')}
            >
              <img src="/ui/Gem.Png" alt="Gems" className="w-6 h-6 mr-2" />
              <span 
                className="text-base font-bold text-purple-400"
                style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}
              >
                {user.gems.toLocaleString()}
              </span>
              <span className="ml-2 w-4 h-4 flex items-center justify-center bg-green-500 rounded-full text-white text-xs font-bold">+</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              className="w-10 h-10 flex items-center justify-center  hover:scale-120 transition-colors"
              onClick={() => setShowSettings(true)}
            >
              <img src="/ui/Settings.Png" alt="Settings" className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <Settings
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </>
  );
}