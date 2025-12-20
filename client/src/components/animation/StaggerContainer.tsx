import { motion } from 'framer-motion';
import { StaggerContainerProps } from './types';
import { createStaggerContainerVariants } from './variants';

export function StaggerContainer({
  children,
  staggerDelay = 0.1,
  as = 'div',
  className = '',
  style,
  onAnimationComplete,
}: StaggerContainerProps) {
  const Component = motion[as as keyof typeof motion] as typeof motion.div;

  return (
    <Component
      variants={createStaggerContainerVariants(staggerDelay)}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
      style={style}
      onAnimationComplete={onAnimationComplete}
    >
      {children}
    </Component>
  );
}
