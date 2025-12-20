import { motion } from 'framer-motion';
import { PressAnimationProps } from './types';
import { SPRINGS } from './variants';

export function PressAnimation({
  children,
  scaleAmount = 0.95,
  disabled = false,
  className = '',
  style,
}: PressAnimationProps) {
  return (
    <motion.div
      whileTap={disabled ? undefined : { scale: scaleAmount }}
      transition={SPRINGS.default}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}
