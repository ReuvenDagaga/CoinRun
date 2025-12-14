// pages/Shop.tsx

import TextWithShadow from "@/components/TextWithShadow";

interface ShopItem {
  id: string;
  image: string;
  description: string;
  price: string;
  tag?: string;
  tagColor?: string;
}

const giftItems: ShopItem[] = [
  { id: 'gift1', image: '/ui/shop/gift-small.png', description: '100 Coins', price: 'Watch Ad' },
  { id: 'gift2', image: '/ui/shop/gift-big.png', description: '500 Coins + 20 Gems', price: 'Watch Ad' },
];

const crateItems: ShopItem[] = [
  { id: 'crate1', image: '/ui/shop/crate-bronze.png', description: '1 Crate', price: '$0.99' },
  { id: 'crate2', image: '/ui/shop/crate-silver.png', description: '3 Crates +10%', price: '$2.49', tag: 'BEST', tagColor: 'bg-yellow-500' },
  { id: 'crate3', image: '/ui/shop/crate-gold.png', description: '10 Crates +25%', price: '$6.99' },
];

const gemItems: ShopItem[] = [
  { id: 'gem1', image: '/ui/shop/gems-small.png', description: '50 Gems', price: '$0.99' },
  { id: 'gem2', image: '/ui/shop/gems-medium.png', description: '150 Gems +10%', price: '$2.49', tag: 'POPULAR', tagColor: 'bg-purple-500' },
  { id: 'gem3', image: '/ui/shop/gems-large.png', description: '500 Gems +25%', price: '$6.99' },
];

const coinItems: ShopItem[] = [
  { id: 'coin1', image: '/ui/shop/coins-small.png', description: '5,000 Coins', price: '$0.99' },
  { id: 'coin2', image: '/ui/shop/coins-medium.png', description: '15,000 +15%', price: '$2.49', tag: 'VALUE', tagColor: 'bg-yellow-500' },
  { id: 'coin3', image: '/ui/shop/coins-large.png', description: '50,000 +30%', price: '$6.99' },
];

const comboItems: ShopItem[] = [
  { id: 'combo1', image: '/ui/shop/combo-starter.png', description: '10K + 50 Gems', price: '$1.99' },
  { id: 'combo2', image: '/ui/shop/combo-value.png', description: '50K + 300 Gems', price: '$7.99', tag: '-20%', tagColor: 'bg-red-500' },
  { id: 'combo3', image: '/ui/shop/combo-ultimate.png', description: '200K + 1K Gems', price: '$19.99', tag: '-35%', tagColor: 'bg-red-500' },
];

function GiftCard({ item, onPurchase }: { item: ShopItem; onPurchase: () => void }) {
  return (
    <div 
      className="relative w-full rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-transform shadow-xl"
      onClick={onPurchase}
    >
      <img 
        src={item.image} 
        alt="Gift" 
        className="w-full h-32 object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
        <TextWithShadow className="text-white text-lg font-bold text-center">
          {item.description}
        </TextWithShadow>
        <TextWithShadow className="text-green-400 text-xl font-bold text-center mt-1">
          ▶ {item.price}
        </TextWithShadow>
      </div>
    </div>
  );
}

function ShopCard({ item, onPurchase }: { item: ShopItem; onPurchase: () => void }) {
  return (
    <div 
      className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-transform shadow-xl"
      onClick={onPurchase}
    >
      <img 
        src={item.image} 
        alt="Item" 
        className="absolute inset-0 w-full h-full object-cover"
      />
      {item.tag && (
        <div className={`absolute top-2 right-2 ${item.tagColor} text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg`}>
          {item.tag}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-3">
        <TextWithShadow className="text-white text-sm font-bold text-center leading-tight">
          {item.description}
        </TextWithShadow>
        <TextWithShadow className="text-yellow-400 text-lg font-bold text-center mt-1">
          {item.price}
        </TextWithShadow>
      </div>
    </div>
  );
}

function ShopSection({ 
  title, 
  items, 
  bgClass,
  isGift = false
}: { 
  title: string; 
  items: ShopItem[]; 
  bgClass: string;
  isGift?: boolean;
}) {
  const handlePurchase = (id: string) => {
    console.log(`Purchase: ${id}`);
  };

  return (
    <section className={`${bgClass} px-4 py-6`}>
      <TextWithShadow as="h2" className="text-2xl font-bold text-white text-center mb-4">
        {title}
      </TextWithShadow>
      {isGift ? (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <GiftCard 
              key={item.id} 
              item={item} 
              onPurchase={() => handlePurchase(item.id)} 
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {items.map((item) => (
            <ShopCard 
              key={item.id} 
              item={item} 
              onPurchase={() => handlePurchase(item.id)} 
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default function Shop() {
  return (
    <div className="min-h-full pb-32">
      <ShopSection 
        title="🎁 Free Gifts" 
        items={giftItems} 
        bgClass="bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900" 
        isGift={true}
      />
      <ShopSection 
        title="📦 Crates" 
        items={crateItems} 
        bgClass="bg-gradient-to-b from-amber-900 via-orange-900 to-red-900" 
      />
      <ShopSection 
        title="💎 Gems" 
        items={gemItems} 
        bgClass="bg-gradient-to-b from-violet-900 via-purple-900 to-fuchsia-900" 
      />
      <ShopSection 
        title="🪙 Coins" 
        items={coinItems} 
        bgClass="bg-gradient-to-b from-yellow-900 via-amber-800 to-yellow-900" 
      />
      <ShopSection 
        title="⭐ Combo Deals" 
        items={comboItems} 
        bgClass="bg-gradient-to-b from-cyan-900 via-teal-900 to-emerald-900" 
      />
    </div>
  );
}