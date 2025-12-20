import { motion } from 'framer-motion';
import { FadeInProps } from './types';
import { fadeVariants, createFadeUpVariants, DURATIONS, EASINGS } from './variants';

export function FadeIn({
  children,
  duration = DURATIONS.normal,
  delay = 0,
  distance = 0,
  className = '',
  style,
  onAnimationComplete,
}: FadeInProps) {
  const variants = distance > 0 ? createFadeUpVariants(distance) : fadeVariants;

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration, delay, ease: EASINGS.easeOut }}
      className={className}
      style={style}
      onAnimationComplete={onAnimationComplete}
    >
      {children}
    </motion.div>
  );
}
