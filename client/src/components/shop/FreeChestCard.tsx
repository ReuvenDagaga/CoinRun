import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TextWithShadow from "../TextWithShadow";
import ButtonSpinner from "../ui/ButtonSpinner";
import { useChestTimer, formatCountdown } from "@/hooks/useChestTimer";
import { useAuth } from "@/hooks/useAuth";
import { CHEST_TIER_COLORS, ChestTier } from "@shared/interface/IChest";
import ChestOpeningModal from "../chests/ChestOpeningModal";

const CHEST_IMAGES: Record<ChestTier, string> = {
  bronze: "/ui/chests/chest_bronze.png",
  silver: "/ui/chests/chest_silver.png",
  gold: "/ui/chests/chest_gold.png",
};

function FreeChestCard() {
  const { token, refreshUser } = useAuth();
  const { status, countdown, isReady, isLoading, claimChest } = useChestTimer(token);
  const [showOpening, setShowOpening] = useState(false);
  const [rewards, setRewards] = useState<any>(null);

  const handleClaim = async () => {
    if (!isReady || isLoading) return;

    const result = await claimChest();
    if (result) {
      setRewards(result);
      setShowOpening(true);
    }
  };

  const handleCloseOpening = async () => {
    setShowOpening(false);
    setRewards(null);
    // Refresh user data to update coins/gems after viewing rewards
    await refreshUser();
  };

  const tier = status?.tier || "bronze";
  const tierColor = CHEST_TIER_COLORS[tier];

  return (
    <>
      <div
        className="relative w-full rounded-2xl overflow-hidden shadow-xl mt-10"
        style={{ aspectRatio: "16/7" }}
      >
        {/* Background gradient based on chest tier */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${tierColor}40 0%, ${tierColor}20 50%, #1a1a2e 100%)`,
          }}
        />

        {/* Shimmer effect when ready */}
        {isReady && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          />
        )}

        <div className="absolute inset-0 flex items-center justify-between px-5">
          {/* Left side - Chest image */}
          <div className="relative">
            <motion.img
              src={CHEST_IMAGES[tier]}
              alt={`${tier} chest`}
              className="h-24 w-auto object-contain drop-shadow-2xl"
              animate={isReady ? { scale: [1, 1.05, 1], rotate: [-2, 2, -2] } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
            {isReady && (
              <motion.div
                className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <span className="text-white text-xs font-bold">!</span>
              </motion.div>
            )}
          </div>

          {/* Right side - Info and button */}
          <div className="flex flex-col items-end gap-2">
            <TextWithShadow
              className="text-2xl font-bold capitalize"
              style={{ color: tierColor }}
            >
              {tier} Chest
            </TextWithShadow>

            <TextWithShadow className="text-white/80 text-sm">
              {isReady ? "Ready to open!" : "Free chest"}
            </TextWithShadow>

            <button
              className={`flex items-center gap-2 px-6 py-2 mt-2
                active:scale-95 transition-transform bg-no-repeat bg-center
                ${!isReady ? "opacity-70" : ""}`}
              style={{
                backgroundImage: isReady
                  ? "url('/ui/Button/Green_.Png')"
                  : "url('/ui/Button/Gray_.Png')",
                backgroundSize: "100% 100%",
                minWidth: "140px",
                minHeight: "45px",
              }}
              onClick={handleClaim}
              disabled={!isReady || isLoading}
            >
              {isLoading ? (
                <ButtonSpinner size="small" />
              ) : isReady ? (
                <>
                  <img
                    src="/ui/IconMisc/Gift.Png"
                    alt=""
                    className="w-5 h-5 object-contain"
                  />
                  <TextWithShadow className="text-white font-bold text-lg">
                    Open!
                  </TextWithShadow>
                </>
              ) : (
                <TextWithShadow className="text-white font-bold text-lg font-mono">
                  {formatCountdown(countdown)}
                </TextWithShadow>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Chest Opening Modal */}
      <AnimatePresence>
        {showOpening && rewards && (
          <ChestOpeningModal
            tier={tier}
            rewards={rewards}
            onClose={handleCloseOpening}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default FreeChestCard;
