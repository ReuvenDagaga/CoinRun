import { useState } from "react";
import ComboCard from "./ComboCard";
import { ShopItem } from "./config";
import GiftCard from "./GiftCard";
import ShopCard from "./ShopCard";

function ShopSection ({
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
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handlePurchase = async (id: string) => {
    setPurchasing(id);
    console.log(`Purchase: ${id}`);
    // TODO: Add actual purchase API call here
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    setPurchasing(null);
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
                isPurchasing={purchasing === item.id}
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
                isPurchasing={purchasing === item.id}
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
                isPurchasing={purchasing === item.id}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default ShopSection;