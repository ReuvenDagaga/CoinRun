import { motion } from 'framer-motion';

export default function UpgradeIndicator() {
  return (
    <div className="relative">
      {/* Green glow background */}
      <div
        className="absolute inset-0 rounded-full blur-md"
        style={{
          backgroundColor: 'rgba(34, 197, 94, 0.4)',
          transform: 'scale(1.5)',
        }}
      />

      {/* Animated arrow */}
      <motion.img
        src="/ui/cards/upgrade.png"
        alt="Upgrade available"
        className="w-8 h-8 relative"
        animate={{
          y: [0, -4, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}
