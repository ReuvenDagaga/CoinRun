import { motion } from 'framer-motion';
import { PopInProps } from './types';
import { popVariants } from './variants';

export function PopIn({
  children,
  intensity = 'normal',
  delay = 0,
  className = '',
  style,
  onAnimationComplete,
}: PopInProps) {
  const variants = popVariants[intensity];

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ delay }}
      className={className}
      style={style}
      onAnimationComplete={onAnimationComplete}
    >
      {children}
    </motion.div>
  );
}
