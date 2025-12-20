import { useState, useEffect } from "react";
import { coinItems, comboItems, crateItems, gemItems, giftItems } from "@/components/shop/config";
import CrateSection from "@/components/shop/CrateSection";
import ShopSection from "@/components/shop/ShopSection";
import BaseLoading from "@/components/ui/BaseLoading";

export default function Shop() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);

  useEffect(() => {
    // List of all background images that need to be preloaded
    const backgroundImages = [
      "/ui/shop/BgShopFree.Png",
      "/ui/shop/BgShopCombo.Png",
      "/ui/shop/BgShopCreate.Png",
      "/ui/shop/BgShopGems.Png",
      "/ui/shop/BgShopCoins.Png"
    ];

    let loadedCount = 0;
    const totalImages = backgroundImages.length;

    // Preload all images
    const imagePromises = backgroundImages.map((src) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          loadedCount++;
          setLoadProgress(Math.round((loadedCount / totalImages) * 100));
          resolve();
        };
        img.onerror = () => {
          loadedCount++;
          setLoadProgress(Math.round((loadedCount / totalImages) * 100));
          resolve(); // Resolve even on error to prevent blocking
        };
        img.src = src;
      });
    });

    // Wait for all images to load
    Promise.all(imagePromises).then(() => {
      setIsLoading(false);
    });
  }, []);

  // Show loading screen until all images are loaded
  if (isLoading) {
    return <BaseLoading message="Loading Shop..." progress={loadProgress} />;
  }

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