import { coinItems, comboItems, crateItems, gemItems, giftItems } from "@/components/shop/config";
import CrateSection from "@/components/shop/CrateSection";
import ShopSection from "@/components/shop/ShopSection";


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