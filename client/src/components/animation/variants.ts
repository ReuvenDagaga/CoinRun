import { Variants } from 'framer-motion';

// ============================================
// TIMING PRESETS
// ============================================

export const DURATIONS = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  verySlow: 0.8,
} as const;

export const EASINGS = {
  // Subtle for navigation
  easeOut: [0.0, 0.0, 0.2, 1] as const,
  easeIn: [0.4, 0.0, 1, 1] as const,
  easeInOut: [0.4, 0.0, 0.2, 1] as const,

  // Playful for game elements
  bounce: [0.68, -0.55, 0.265, 1.55] as const,
} as const;

export const SPRINGS = {
  default: { type: 'spring' as const, stiffness: 400, damping: 25 },
  bouncy: { type: 'spring' as const, stiffness: 300, damping: 15 },
  gentle: { type: 'spring' as const, stiffness: 200, damping: 20 },
} as const;

// ============================================
// FADE VARIANTS
// ============================================

export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const createFadeUpVariants = (distance: number = 20): Variants => ({
  initial: { opacity: 0, y: distance },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -distance / 2 },
});

// ============================================
// SLIDE VARIANTS
// ============================================

export const createSlideVariants = (
  direction: 'up' | 'down' | 'left' | 'right',
  distance: number = 30
): Variants => {
  const axis = direction === 'up' || direction === 'down' ? 'y' : 'x';
  const value = direction === 'up' || direction === 'left' ? distance : -distance;

  return {
    initial: { opacity: 0, [axis]: value },
    animate: { opacity: 1, [axis]: 0 },
    exit: { opacity: 0, [axis]: -value / 2 },
  };
};

// ============================================
// SCALE VARIANTS
// ============================================

export const createScaleVariants = (initialScale: number = 0.8): Variants => ({
  initial: { opacity: 0, scale: initialScale },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: initialScale },
});

// ============================================
// POP (BOUNCE) VARIANTS - Playful for game
// ============================================

export const popVariants = {
  subtle: {
    initial: { opacity: 0, scale: 0.9 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 25,
      },
    },
    exit: { opacity: 0, scale: 0.9 },
  },
  normal: {
    initial: { opacity: 0, scale: 0.6 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 15,
      },
    },
    exit: { opacity: 0, scale: 0.6 },
  },
  playful: {
    initial: { opacity: 0, scale: 0.3, rotate: -10 },
    animate: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        type: 'spring',
        stiffness: 260,
        damping: 12,
      },
    },
    exit: { opacity: 0, scale: 0.3, rotate: 10 },
  },
} as const;

// ============================================
// STAGGER VARIANTS
// ============================================

export const createStaggerContainerVariants = (staggerDelay: number = 0.1): Variants => ({
  initial: {},
  animate: {
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: staggerDelay / 2,
      staggerDirection: -1,
    },
  },
});

export const staggerItemVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
  exit: { opacity: 0, y: -10 },
};

// ============================================
// PAGE TRANSITION VARIANTS
// ============================================

export const pageTransitionVariants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
} as const;

// ============================================
// MODAL VARIANTS
// ============================================

export const modalBackdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const modalContentVariants: Variants = {
  initial: { opacity: 0, scale: 0.9, y: 20 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: {
      duration: 0.2,
    },
  },
};

// ============================================
// HOVER SHADOW HELPER
// ============================================

export function getHoverShadow(intensity: string): string {
  switch (intensity) {
    case 'none':
      return '0 0 0 0 transparent';
    case 'subtle':
      return '0 4px 12px -2px rgba(0, 0, 0, 0.15)';
    case 'normal':
      return '0 8px 24px -4px rgba(0, 0, 0, 0.2)';
    case 'strong':
      return '0 12px 32px -4px rgba(0, 0, 0, 0.3)';
    default:
      return '0 8px 24px -4px rgba(0, 0, 0, 0.2)';
  }
}
