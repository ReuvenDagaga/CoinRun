import { motion } from 'framer-motion';
import { SlideInProps } from './types';
import { createSlideVariants, DURATIONS, EASINGS } from './variants';

export function SlideIn({
  children,
  direction = 'up',
  distance = 30,
  duration = DURATIONS.normal,
  delay = 0,
  className = '',
  style,
  onAnimationComplete,
}: SlideInProps) {
  return (
    <motion.div
      variants={createSlideVariants(direction, distance)}
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
