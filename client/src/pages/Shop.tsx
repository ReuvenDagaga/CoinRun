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
  { id: 'gift1', image: '/ui/shop/100CoinsAd.Png', description: '100 Coins', price: 'Watch Ad' },
  { id: 'gift2', image: '/ui/shop/500Coins20GemsAd.Png', description: '500 Coins + 20 Gems', price: 'Watch Ad' },
];

const comboItems: ShopItem[] = [
  { id: 'combo1', image: '/ui/shop/10000Coins50Gems.Png', description: '10K + 50 Gems', price: '$1.99' },
  { id: 'combo2', image: '/ui/shop/50000Coins300Gems.Png', description: '50K + 300 Gems', price: '$7.99', tag: '-20%', tagColor: 'bg-red-500' },
  { id: 'combo3', image: '/ui/shop/200KCoins1000Gems.Png', description: '200K + 1K Gems', price: '$19.99', tag: '-35%', tagColor: 'bg-red-500' },
];

const crateItems: ShopItem[] = [
  { id: 'crate1', image: '/ui/shop/CreateA.Png', description: '1 Crate', price: '$0.99' },
  { id: 'crate2', image: '/ui/shop/CreateB.Png', description: '3 Crates +10%', price: '$2.49', tag: 'BEST', tagColor: 'bg-yellow-500' },
  { id: 'crate3', image: '/ui/shop/CreateC.Png', description: '10 Crates +25%', price: '$6.99' },
];

const gemItems: ShopItem[] = [
  { id: 'gem1', image: '/ui/shop/gems-small.png', description: '50 Gems', price: '$0.99' },
  { id: 'gem2', image: '/ui/shop/gems-medium.png', description: '150 Gems +10%', price: '$2.49', tag: 'POPULAR', tagColor: 'bg-purple-500' },
  { id: 'gem3', image: '/ui/shop/gems-large.png', description: '500 Gems +25%', price: '$6.99' },
];

const coinItems: ShopItem[] = [
  { id: 'coin1', image: '/ui/shop/CoinsA.Png', description: '5,000 Coins', price: '$0.99' },
  { id: 'coin2', image: '/ui/shop/CoinsB.Png', description: '15,000 +15%', price: '$2.49', tag: 'VALUE', tagColor: 'bg-yellow-500' },
  { id: 'coin3', image: '/ui/shop/CoinsC.Png', description: '50,000 +30%', price: '$6.99' },
];

function GiftCard({ item, onPurchase }: { item: ShopItem; onPurchase: () => void }) {
  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-transform shadow-xl"
      style={{ aspectRatio: '16/7' }}
      onClick={onPurchase}
    >
      <img
        src={item.image}
        alt="Gift"
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="absolute inset-0 flex items-center justify-between px-5">
        <div className="flex flex-col gap-1">
          <TextWithShadow className="text-white text-2xl font-bold">
            {item.description}
          </TextWithShadow>

          <button
            className="flex items-center gap-2 mt-5 px-6 py-2 
              active:scale-95 transition-transform bg-no-repeat bg-center"
            style={{
              backgroundImage: "url('/ui/Button/Green_.Png')",
              backgroundSize: '100% 100%',
              minWidth: '100px',
              maxWidth: '160px',
              minHeight: '45px'
            }}
          >
            <img
              src="/ui/AdVideo.Png"
              alt=""
              className="w-5 h-5 object-contain"
            />
            <TextWithShadow className="text-white font-bold text-lg">
              {item.price}
            </TextWithShadow>
          </button>
        </div>
      </div>
    </div>
  );
}

function ComboCard({ item, onPurchase }: { item: ShopItem; onPurchase: () => void }) {
  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-transform shadow-xl"
      style={{ aspectRatio: '16/7' }}
      onClick={onPurchase}
    >
      <img
        src={item.image}
        alt="Combo"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {item.tag && (
        <div className={`absolute top-3 right-3 ${item.tagColor} text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg`}>
          {item.tag}
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent flex items-center px-5">
        <div className="flex flex-col gap-1">
          <TextWithShadow className="text-white text-2xl font-bold">
            {item.description}
          </TextWithShadow>

          <button
            className="flex items-center justify-center gap-2 mt-3 px-6 py-2 
              active:scale-95 transition-transform bg-no-repeat bg-center"
            style={{
              backgroundImage: "url('/ui/Button/Green_.Png')",
              backgroundSize: '100% 100%',
              minWidth: '120px',
              maxWidth: '160px',
              minHeight: '45px'
            }}
          >
            <TextWithShadow className="text-white font-bold text-lg">
              {item.price}
            </TextWithShadow>
          </button>
        </div>
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

function CrateSection({
  items,
  backgroundImage
}: {
  items: ShopItem[];
  backgroundImage: string;
}) {
  const handlePurchase = (id: string) => {
    console.log(`Purchase: ${id}`);
  };

  const premiumCrate = items[2];
  const basicCrates = [items[0], items[1]];

  return (
    <section
      className="relative px-4 py-6"
      style={{
        backgroundImage: `url('${backgroundImage}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10">
        <div className="flex flex-col gap-3">
          <div
            className="relative w-full rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-transform shadow-xl bg-gradient-to-b from-red-700 via-red-800 to-red-950 p-4"
            onClick={() => handlePurchase(premiumCrate.id)}
          >
            {premiumCrate.tag && (
              <div className={`absolute top-1 right-3 ${premiumCrate.tagColor} text-white text-sm font-bold py-1 rounded-full shadow-lg z-10`}>
                {premiumCrate.tag}
              </div>
            )}
            <div className="flex flex-col items-center">
              <img
                src={premiumCrate.image}
                alt="Premium Crate"
                className="w-60 h-32 object-contain drop-shadow-2xl"
              />
              <TextWithShadow className="text-white text-xl font-bold mt-2">
                {premiumCrate.description}
              </TextWithShadow>
              <TextWithShadow className="text-yellow-400 text-2xl font-bold mt-1">
                {premiumCrate.price}
              </TextWithShadow>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {basicCrates.map((item, index) => (
              <div
                key={item.id}
                className={`relative rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-transform shadow-xl p-3 ${
                  index === 0 
                    ? 'bg-gradient-to-b from-amber-600 via-amber-700 to-amber-900' 
                    : 'bg-gradient-to-b from-blue-500 via-blue-600 to-blue-800'
                }`}
                onClick={() => handlePurchase(item.id)}
              >
                {item.tag && (
                  <div className={`absolute top-2 right-2 ${item.tagColor} text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg z-10`}>
                    {item.tag}
                  </div>
                )}
                <div className="flex flex-col items-center">
                  <img
                    src={item.image}
                    alt="Crate"
                    className="w-20 h-20 object-contain drop-shadow-xl"
                  />
                  <TextWithShadow className="text-white text-sm font-bold mt-2">
                    {item.description}
                  </TextWithShadow>
                  <TextWithShadow className="text-yellow-400 text-lg font-bold mt-1">
                    {item.price}
                  </TextWithShadow>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
function ShopSection({
  items,
  backgroundImage,
  isGift = false,
  isCombo = false
}: {
  items: ShopItem[];
  backgroundImage: string;
  isGift?: boolean;
  isCombo?: boolean;
}) {
  const handlePurchase = (id: string) => {
    console.log(`Purchase: ${id}`);
  };

  return (
    <section
      className="relative px-4 py-6"
      style={{
        backgroundImage: `url('${backgroundImage}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10">
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
        ) : isCombo ? (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <ComboCard
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
      </div>
    </section>
  );
}

export default function Shop() {
  return (
    <div className="min-h-full pb-32">
      <ShopSection
        items={giftItems}
        backgroundImage="/ui/shop/BgShopFree.Png"
        isGift={true}
      />
      <ShopSection
        items={comboItems}
        backgroundImage="/ui/shop/BgShopCombo.Png"
        isCombo={true}
      />
      <CrateSection
        items={crateItems}
        backgroundImage="/ui/shop/BgShopCreate.Png"
      />
      <ShopSection
        items={gemItems}
        backgroundImage="/ui/shop/BgShopGems.Png"
      />
      <ShopSection
        items={coinItems}
        backgroundImage="/ui/shop/BgShopCoins.Png"
      />
    </div>
  );
}