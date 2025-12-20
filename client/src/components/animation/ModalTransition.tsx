import { motion, AnimatePresence } from 'framer-motion';
import { ModalTransitionProps } from './types';
import { modalBackdropVariants, modalContentVariants, DURATIONS } from './variants';

export function ModalTransition({
  children,
  isOpen,
  onClose,
  closeOnBackdropClick = true,
  duration = DURATIONS.normal,
  backdropClassName = '',
  contentClassName = '',
  className = '',
  style,
}: ModalTransitionProps) {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnBackdropClick && onClose) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={modalBackdropVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration }}
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm ${backdropClassName}`}
          onClick={handleBackdropClick}
        >
          <motion.div
            variants={modalContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`relative ${contentClassName} ${className}`}
            style={style}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
