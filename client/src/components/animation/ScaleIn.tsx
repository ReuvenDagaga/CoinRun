import { motion } from 'framer-motion';
import { ScaleInProps } from './types';
import { createScaleVariants, DURATIONS, EASINGS } from './variants';

export function ScaleIn({
  children,
  initialScale = 0.8,
  originX = 0.5,
  originY = 0.5,
  duration = DURATIONS.normal,
  delay = 0,
  className = '',
  style,
  onAnimationComplete,
}: ScaleInProps) {
  return (
    <motion.div
      variants={createScaleVariants(initialScale)}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration, delay, ease: EASINGS.easeOut }}
      className={className}
      style={{
        ...style,
        transformOrigin: `${originX * 100}% ${originY * 100}%`,
      }}
      onAnimationComplete={onAnimationComplete}
    >
      {children}
    </motion.div>
  );
}
