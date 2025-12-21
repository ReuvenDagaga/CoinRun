import { coinItems, comboItems, crateItems, gemItems, giftItems } from "@/components/shop/config";
import CrateSection from "@/components/shop/CrateSection";
import ShopSection from "@/components/shop/ShopSection";
import PageReveal, { StaggerContainer, StaggerItem } from "@/components/ui/PageReveal";

export default function Shop() {
  return (
    <PageReveal>
      <StaggerContainer className="min-h-full pb-32">
        <StaggerItem>
          <ShopSection
            items={giftItems}
            backgroundImage="/ui/shop/BgShopFree.Png"
            isGift={true}
          />
        </StaggerItem>
        <StaggerItem>
          <ShopSection
            items={comboItems}
            backgroundImage="/ui/shop/BgShopCombo.Png"
            isCombo={true}
          />
        </StaggerItem>
        <StaggerItem>
          <CrateSection
            items={crateItems}
            backgroundImage="/ui/shop/BgShopCreate.Png"
          />
        </StaggerItem>
        <StaggerItem>
          <ShopSection
            items={gemItems}
            backgroundImage="/ui/shop/BgShopGems.Png"
          />
        </StaggerItem>
        <StaggerItem>
          <ShopSection
            items={coinItems}
            backgroundImage="/ui/shop/BgShopCoins.Png"
          />
        </StaggerItem>
      </StaggerContainer>
    </PageReveal>
  );
}