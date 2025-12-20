import { motion } from 'framer-motion';
import { CardHoverProps } from './types';
import { getHoverShadow, SPRINGS } from './variants';

export function CardHover({
  children,
  scaleAmount = 1.02,
  liftAmount = 4,
  shadowIntensity = 'normal',
  className = '',
  style,
}: CardHoverProps) {
  return (
    <motion.div
      initial={{
        scale: 1,
        y: 0,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      }}
      whileHover={{
        scale: scaleAmount,
        y: -liftAmount,
        boxShadow: getHoverShadow(shadowIntensity),
      }}
      transition={SPRINGS.default}
      className={`cursor-pointer ${className}`}
      style={style}
    >
      {children}
    </motion.div>
  );
}
