// pages/Shop.tsx
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

const textShadow = '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000';

interface GiftBox {
  id: string;
  name: string;
  image: string;
  reward: { coins?: number; gems?: number };
  adRequired: boolean;
}

interface Package {
  id: string;
  name: string;
  image: string;
  amount: number;
  price: number;
  bonus?: number;
  popular?: boolean;
}

interface ComboPackage {
  id: string;
  name: string;
  image: string;
  coins: number;
  gems: number;
  price: number;
  discount?: number;
}

const giftBoxes: GiftBox[] = [
  { id: 'gift1', name: 'Small Gift', image: '/ui/shop/gift-small.png', reward: { coins: 100 }, adRequired: true },
  { id: 'gift2', name: 'Big Gift', image: '/ui/shop/gift-big.png', reward: { coins: 300, gems: 10 }, adRequired: true },
];

const cratePackages: Package[] = [
  { id: 'crate1', name: 'Bronze Crate', image: '/ui/shop/crate-bronze.png', amount: 1, price: 0.99 },
  { id: 'crate2', name: 'Silver Crate', image: '/ui/shop/crate-silver.png', amount: 3, price: 2.49, bonus: 10 },
  { id: 'crate3', name: 'Gold Crate', image: '/ui/shop/crate-gold.png', amount: 10, price: 6.99, bonus: 25, popular: true },
];

const gemPackages: Package[] = [
  { id: 'gem1', name: 'Handful', image: '/ui/shop/gems-small.png', amount: 50, price: 0.99 },
  { id: 'gem2', name: 'Pouch', image: '/ui/shop/gems-medium.png', amount: 150, price: 2.49, bonus: 10, popular: true },
  { id: 'gem3', name: 'Chest', image: '/ui/shop/gems-large.png', amount: 500, price: 6.99, bonus: 25 },
];

const coinPackages: Package[] = [
  { id: 'coin1', name: 'Stack', image: '/ui/shop/coins-small.png', amount: 5000, price: 0.99 },
  { id: 'coin2', name: 'Pile', image: '/ui/shop/coins-medium.png', amount: 15000, price: 2.49, bonus: 15, popular: true },
  { id: 'coin3', name: 'Vault', image: '/ui/shop/coins-large.png', amount: 50000, price: 6.99, bonus: 30 },
];

const comboPackages: ComboPackage[] = [
  { id: 'combo1', name: 'Starter Pack', image: '/ui/shop/combo-starter.png', coins: 10000, gems: 50, price: 1.99 },
  { id: 'combo2', name: 'Value Pack', image: '/ui/shop/combo-value.png', coins: 50000, gems: 300, price: 7.99, discount: 20 },
  { id: 'combo3', name: 'Ultimate Pack', image: '/ui/shop/combo-ultimate.png', coins: 200000, gems: 1000, price: 19.99, discount: 35 },
];

export default function Shop() {
  const { user } = useAuth();
  const [watchingAd, setWatchingAd] = useState<string | null>(null);

  const handleWatchAd = (giftId: string) => {
    setWatchingAd(giftId);
    setTimeout(() => {
      setWatchingAd(null);
    }, 3000);
  };

  const handlePurchase = (packageId: string, price: number) => {
    console.log(`Purchase ${packageId} for $${price}`);
  };

  return (
    <div className="flex flex-col gap-0 pb-32">
      <section className="bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 px-4 py-6">
        <h2 
          className="text-2xl font-bold text-white text-center mb-4"
          style={{ textShadow }}
        >
          🎁 Free Gifts
        </h2>
        <div className="flex justify-center gap-4">
          {giftBoxes.map((gift) => (
            <div 
              key={gift.id}
              className="relative flex flex-col items-center bg-white/10 backdrop-blur rounded-2xl p-4 border-2 border-purple-400/50 w-36"
            >
              <img src={gift.image} alt={gift.name} className="w-20 h-20 object-contain mb-2" />
              <span 
                className="text-white font-bold text-sm mb-1"
                style={{ textShadow }}
              >
                {gift.name}
              </span>
              <div className="flex items-center gap-1 text-yellow-400 text-xs mb-3">
                {gift.reward.coins && (
                  <span className="flex items-center">
                    <img src="/ui/Coin.Png" className="w-4 h-4 mr-1" />
                    {gift.reward.coins}
                  </span>
                )}
                {gift.reward.gems && (
                  <span className="flex items-center ml-2">
                    <img src="/ui/Gem.Png" className="w-4 h-4 mr-1" />
                    {gift.reward.gems}
                  </span>
                )}
              </div>
              <button
                onClick={() => handleWatchAd(gift.id)}
                disabled={watchingAd === gift.id}
                className="w-full py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold rounded-lg text-sm transition-all disabled:opacity-50"
                style={{ textShadow }}
              >
                {watchingAd === gift.id ? '⏳ Watching...' : '▶ Watch Ad'}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-b from-amber-900 via-orange-900 to-red-900 px-4 py-6">
        <h2 
          className="text-2xl font-bold text-white text-center mb-4"
          style={{ textShadow }}
        >
          📦 Crates
        </h2>
        <div className="flex justify-center gap-3">
          {cratePackages.map((pkg) => (
            <div 
              key={pkg.id}
              className={`relative flex flex-col items-center bg-white/10 backdrop-blur rounded-2xl p-3 border-2 w-28 ${
                pkg.popular ? 'border-yellow-400 shadow-lg shadow-yellow-400/30' : 'border-orange-400/50'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                  BEST
                </div>
              )}
              <img src={pkg.image} alt={pkg.name} className="w-16 h-16 object-contain mb-2" />
              <span 
                className="text-white font-bold text-xs text-center mb-1"
                style={{ textShadow }}
              >
                {pkg.name}
              </span>
              <span className="text-orange-300 text-sm font-bold">x{pkg.amount}</span>
              {pkg.bonus && (
                <span className="text-green-400 text-xs">+{pkg.bonus}% Bonus</span>
              )}
              <button
                onClick={() => handlePurchase(pkg.id, pkg.price)}
                className="w-full mt-2 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold rounded-lg text-sm transition-all"
                style={{ textShadow }}
              >
                ${pkg.price}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-b from-violet-900 via-purple-900 to-fuchsia-900 px-4 py-6">
        <h2 
          className="text-2xl font-bold text-white text-center mb-4"
          style={{ textShadow }}
        >
          💎 Gems
        </h2>
        <div className="flex justify-center gap-3">
          {gemPackages.map((pkg) => (
            <div 
              key={pkg.id}
              className={`relative flex flex-col items-center bg-white/10 backdrop-blur rounded-2xl p-3 border-2 w-28 ${
                pkg.popular ? 'border-purple-400 shadow-lg shadow-purple-400/30' : 'border-purple-400/50'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-400 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  POPULAR
                </div>
              )}
              <img src={pkg.image} alt={pkg.name} className="w-16 h-16 object-contain mb-2" />
              <span 
                className="text-white font-bold text-xs text-center mb-1"
                style={{ textShadow }}
              >
                {pkg.name}
              </span>
              <div className="flex items-center">
                <img src="/ui/Gem.Png" className="w-4 h-4 mr-1" />
                <span className="text-purple-300 text-sm font-bold">{pkg.amount.toLocaleString()}</span>
              </div>
              {pkg.bonus && (
                <span className="text-green-400 text-xs">+{pkg.bonus}% Bonus</span>
              )}
              <button
                onClick={() => handlePurchase(pkg.id, pkg.price)}
                className="w-full mt-2 py-2 bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-400 hover:to-fuchsia-400 text-white font-bold rounded-lg text-sm transition-all"
                style={{ textShadow }}
              >
                ${pkg.price}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-b from-yellow-900 via-amber-800 to-yellow-900 px-4 py-6">
        <h2 
          className="text-2xl font-bold text-white text-center mb-4"
          style={{ textShadow }}
        >
          🪙 Coins
        </h2>
        <div className="flex justify-center gap-3">
          {coinPackages.map((pkg) => (
            <div 
              key={pkg.id}
              className={`relative flex flex-col items-center bg-white/10 backdrop-blur rounded-2xl p-3 border-2 w-28 ${
                pkg.popular ? 'border-yellow-400 shadow-lg shadow-yellow-400/30' : 'border-yellow-400/50'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                  VALUE
                </div>
              )}
              <img src={pkg.image} alt={pkg.name} className="w-16 h-16 object-contain mb-2" />
              <span 
                className="text-white font-bold text-xs text-center mb-1"
                style={{ textShadow }}
              >
                {pkg.name}
              </span>
              <div className="flex items-center">
                <img src="/ui/Coin.Png" className="w-4 h-4 mr-1" />
                <span className="text-yellow-300 text-sm font-bold">{pkg.amount.toLocaleString()}</span>
              </div>
              {pkg.bonus && (
                <span className="text-green-400 text-xs">+{pkg.bonus}% Bonus</span>
              )}
              <button
                onClick={() => handlePurchase(pkg.id, pkg.price)}
                className="w-full mt-2 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-white font-bold rounded-lg text-sm transition-all"
                style={{ textShadow }}
              >
                ${pkg.price}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-b from-cyan-900 via-teal-900 to-emerald-900 px-4 py-6">
        <h2 
          className="text-2xl font-bold text-white text-center mb-4"
          style={{ textShadow }}
        >
          ⭐ Combo Deals
        </h2>
        <div className="flex flex-col gap-4 items-center">
          {comboPackages.map((pkg) => (
            <div 
              key={pkg.id}
              className="relative flex items-center bg-white/10 backdrop-blur rounded-2xl p-4 border-2 border-teal-400/50 w-full max-w-sm"
            >
              {pkg.discount && (
                <div className="absolute -top-3 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full rotate-12">
                  -{pkg.discount}%
                </div>
              )}
              <img src={pkg.image} alt={pkg.name} className="w-20 h-20 object-contain mr-4" />
              <div className="flex-1">
                <span 
                  className="text-white font-bold text-lg block mb-1"
                  style={{ textShadow }}
                >
                  {pkg.name}
                </span>
                <div className="flex items-center gap-3 mb-2">
                  <span className="flex items-center text-yellow-400 text-sm">
                    <img src="/ui/Coin.Png" className="w-4 h-4 mr-1" />
                    {pkg.coins.toLocaleString()}
                  </span>
                  <span className="flex items-center text-purple-400 text-sm">
                    <img src="/ui/Gem.Png" className="w-4 h-4 mr-1" />
                    {pkg.gems.toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => handlePurchase(pkg.id, pkg.price)}
                  className="w-full py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold rounded-lg transition-all"
                  style={{ textShadow }}
                >
                  ${pkg.price}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}