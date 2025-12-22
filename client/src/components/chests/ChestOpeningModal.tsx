import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CHEST_TIER_COLORS, ChestTier } from "@shared/interface/IChest";
import { CARD_RARITY_COLORS } from "@shared/interface/ICard";
import TextWithShadow from "../TextWithShadow";

interface CardReward {
  cardId: string;
  name?: string;
  rarity: string;
  type?: string;
  isDuplicate: boolean;
  conversionReward?: { coins: number; gems: number };
}

interface ChestRewards {
  cards: CardReward[];
  coins: number;
  gems: number;
}

interface ChestOpeningModalProps {
  tier: ChestTier;
  rewards: ChestRewards;
  onClose: () => void;
}

const CHEST_IMAGES: Record<ChestTier, { closed: string; open: string }> = {
  bronze: {
    closed: "/ui/chests/chest_bronze.png",
    open: "/ui/chests/chest_bronze_open.png",
  },
  silver: {
    closed: "/ui/chests/chest_silver.png",
    open: "/ui/chests/chest_silver_open.png",
  },
  gold: {
    closed: "/ui/chests/chest_gold.png",
    open: "/ui/chests/chest_gold_open.png",
  },
};

type Phase = "shaking" | "opening" | "revealing" | "complete";

export default function ChestOpeningModal({
  tier,
  rewards,
  onClose,
}: ChestOpeningModalProps) {
  const [phase, setPhase] = useState<Phase>("shaking");
  const [revealedIndex, setRevealedIndex] = useState(-1);
  const tierColor = CHEST_TIER_COLORS[tier];

  // Animation phases
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Shaking phase - 1.5 seconds
    timers.push(
      setTimeout(() => {
        setPhase("opening");
      }, 1500)
    );

    // Opening phase - 0.8 seconds
    timers.push(
      setTimeout(() => {
        setPhase("revealing");
      }, 2300)
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  // Reveal cards one by one
  useEffect(() => {
    if (phase !== "revealing") return;

    const totalItems = rewards.cards.length + (rewards.coins > 0 ? 1 : 0) + (rewards.gems > 0 ? 1 : 0);

    if (revealedIndex >= totalItems - 1) {
      setTimeout(() => setPhase("complete"), 500);
      return;
    }

    const timer = setTimeout(() => {
      setRevealedIndex((prev) => prev + 1);
    }, 400);

    return () => clearTimeout(timer);
  }, [phase, revealedIndex, rewards]);

  const handleSkip = useCallback(() => {
    if (phase === "complete") {
      onClose();
    } else {
      setPhase("complete");
      setRevealedIndex(rewards.cards.length + 2);
    }
  }, [phase, onClose, rewards.cards.length]);

  // Build reward items list
  const rewardItems: Array<{ type: "card" | "coins" | "gems"; data: any }> = [
    ...rewards.cards.map((card) => ({ type: "card" as const, data: card })),
    ...(rewards.coins > 0 ? [{ type: "coins" as const, data: rewards.coins }] : []),
    ...(rewards.gems > 0 ? [{ type: "gems" as const, data: rewards.gems }] : []),
  ];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleSkip}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/90" />

      {/* Radial glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${tierColor}40 0%, transparent 50%)`,
        }}
        animate={{
          opacity: phase === "opening" || phase === "revealing" ? [0.5, 1, 0.5] : 0.3,
        }}
        transition={{ repeat: Infinity, duration: 1 }}
      />

      {/* Particles */}
      {(phase === "opening" || phase === "revealing") && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: tierColor,
                left: "50%",
                top: "50%",
              }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x: (Math.random() - 0.5) * 400,
                y: (Math.random() - 0.5) * 400 - 100,
                opacity: 0,
                scale: 0,
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.05,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8 p-8">
        {/* Title */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <TextWithShadow
            className="text-3xl font-bold capitalize"
            style={{ color: tierColor }}
          >
            {tier} Chest
          </TextWithShadow>
        </motion.div>

        {/* Chest */}
        <motion.div
          className="relative"
          animate={
            phase === "shaking"
              ? {
                  rotate: [-3, 3, -3, 3, -3, 3, 0],
                  scale: [1, 1.05, 1, 1.05, 1, 1.1, 1.1],
                }
              : phase === "opening"
              ? { scale: [1.1, 1.3, 0.8], y: [0, -20, 50], opacity: [1, 1, 0] }
              : { opacity: 0, scale: 0 }
          }
          transition={
            phase === "shaking"
              ? { duration: 1.5, ease: "easeInOut" }
              : { duration: 0.8, ease: "easeOut" }
          }
        >
          <img
            src={
              phase === "shaking"
                ? CHEST_IMAGES[tier].closed
                : CHEST_IMAGES[tier].open
            }
            alt="Chest"
            className="w-48 h-48 object-contain drop-shadow-2xl"
          />

          {/* Glow behind chest */}
          <motion.div
            className="absolute inset-0 -z-10 blur-xl rounded-full"
            style={{ background: tierColor }}
            animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
        </motion.div>

        {/* Rewards */}
        <AnimatePresence>
          {(phase === "revealing" || phase === "complete") && (
            <motion.div
              className="flex flex-wrap justify-center gap-4 max-w-md"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {rewardItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0, rotateY: 180 }}
                  animate={
                    revealedIndex >= index || phase === "complete"
                      ? { scale: 1, rotateY: 0 }
                      : { scale: 0, rotateY: 180 }
                  }
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                  }}
                >
                  {item.type === "card" ? (
                    <CardRewardItem card={item.data} />
                  ) : item.type === "coins" ? (
                    <CurrencyRewardItem type="coins" amount={item.data} />
                  ) : (
                    <CurrencyRewardItem type="gems" amount={item.data} />
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tap to continue */}
        {phase === "complete" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <TextWithShadow className="text-white/80 text-lg">
              Tap anywhere to continue
            </TextWithShadow>
          </motion.div>
        )}

        {/* Skip button */}
        {phase !== "complete" && (
          <motion.button
            className="absolute bottom-4 right-4 px-4 py-2 bg-white/10 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            whileHover={{ opacity: 1 }}
            onClick={(e) => {
              e.stopPropagation();
              handleSkip();
            }}
          >
            <TextWithShadow className="text-white text-sm">Skip</TextWithShadow>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

// Card reward item component
function CardRewardItem({ card }: { card: CardReward }) {
  const rarityColor = CARD_RARITY_COLORS[card.rarity as keyof typeof CARD_RARITY_COLORS] || "#888";
  const cardName = card.name || card.cardId.replace(/_/g, " ").replace(/\d+$/, "").trim();

  return (
    <motion.div
      className="relative w-24 h-32 rounded-xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${rarityColor}40, ${rarityColor}20)`,
        border: `2px solid ${rarityColor}`,
      }}
      whileHover={{ scale: 1.05 }}
    >
      {/* Card content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
        {/* Card type icon */}
        <img
          src={`/ui/cards/${card.type || "speed"}/${card.cardId}.png`}
          alt={cardName}
          className="w-12 h-12 object-contain mb-1"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/ui/cards/placeholder.png";
          }}
        />

        {/* Rarity */}
        <TextWithShadow
          className="text-xs font-bold uppercase"
          style={{ color: rarityColor }}
        >
          {card.rarity}
        </TextWithShadow>

        {/* Duplicate indicator */}
        {card.isDuplicate && (
          <div className="absolute top-1 right-1 bg-yellow-500/80 px-1 rounded text-xs">
            DUP
          </div>
        )}

        {/* Conversion reward */}
        {card.isDuplicate && card.conversionReward && (
          <div className="absolute bottom-1 left-1 right-1 bg-black/60 rounded px-1 py-0.5 flex justify-center gap-1 text-xs">
            {card.conversionReward.coins > 0 && (
              <span className="text-yellow-400">+{card.conversionReward.coins}</span>
            )}
            {card.conversionReward.gems > 0 && (
              <span className="text-purple-400">+{card.conversionReward.gems}</span>
            )}
          </div>
        )}
      </div>

      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ repeat: Infinity, duration: 2 }}
      />
    </motion.div>
  );
}

// Currency reward item component
function CurrencyRewardItem({
  type,
  amount,
}: {
  type: "coins" | "gems";
  amount: number;
}) {
  const isCoins = type === "coins";
  const color = isCoins ? "#FFD700" : "#AA00FF";

  return (
    <motion.div
      className="relative w-24 h-32 rounded-xl overflow-hidden flex flex-col items-center justify-center"
      style={{
        background: `linear-gradient(135deg, ${color}40, ${color}20)`,
        border: `2px solid ${color}`,
      }}
      whileHover={{ scale: 1.05 }}
    >
      <img
        src={isCoins ? "/ui/coin.png" : "/ui/gem.png"}
        alt={type}
        className="w-12 h-12 object-contain mb-2"
      />
      <TextWithShadow className="text-xl font-bold" style={{ color }}>
        +{amount.toLocaleString()}
      </TextWithShadow>
      <TextWithShadow className="text-xs text-white/70 uppercase">
        {type}
      </TextWithShadow>

      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ repeat: Infinity, duration: 2 }}
      />
    </motion.div>
  );
}
