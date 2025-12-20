import { motion } from 'framer-motion';
import { StaggerItemProps } from './types';
import { staggerItemVariants } from './variants';

export function StaggerItem({
  children,
  className = '',
  style,
}: StaggerItemProps) {
  return (
    <motion.div variants={staggerItemVariants} className={className} style={style}>
      {children}
    </motion.div>
  );
}
