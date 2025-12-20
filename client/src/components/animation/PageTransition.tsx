import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageTransitionProps } from './types';
import { pageTransitionVariants, DURATIONS, EASINGS } from './variants';

export function PageTransition({
  children,
  mode = 'fade',
  duration = DURATIONS.normal,
  delay = 0,
  className = '',
  style,
}: PageTransitionProps) {
  const variants = pageTransitionVariants[mode];

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration, delay, ease: EASINGS.easeOut }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// For use with React Router - wrap Routes component
export function AnimatedRoutes({ children }: { children: ReactNode }) {
  return <AnimatePresence mode="wait">{children}</AnimatePresence>;
}
