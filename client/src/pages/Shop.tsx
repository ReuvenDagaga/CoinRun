import { coinItems, comboItems, crateItems, gemItems, giftItems } from "@/components/shop/config";
import CrateSection from "@/components/shop/CrateSection";
import ShopSection from "@/components/shop/ShopSection";
import FreeChestCard from "@/components/shop/FreeChestCard";
import PageReveal, { StaggerContainer, StaggerItem } from "@/components/ui/PageReveal";

export default function Shop() {
  return (
    <PageReveal>
      <StaggerContainer className="min-h-full pb-32">
        {/* Free Chest + Gift Section */}
        <StaggerItem>
          <section
            className="relative px-4 py-6"
            style={{
              backgroundImage: "url('/ui/shop/BgShopFree.Png')",
              backgroundSize: 'cover',
            }}
          >
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative z-10">
              {/* Free Timed Chest */}
              <FreeChestCard />

              {/* Video Ad Gifts */}
              <div className="flex flex-col gap-3 mt-6">
                {giftItems.map((item) => (
                  <div
                    key={item.id}
                    className="relative w-full rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-transform shadow-xl"
                    style={{ aspectRatio: '16/7' }}
                  >
                    <img
                      src={item.image}
                      alt="Gift"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
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