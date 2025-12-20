import { ReactNode } from 'react';

// Base props shared by all animation wrappers
export interface BaseAnimationProps {
  children: ReactNode;
  duration?: number;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  onAnimationComplete?: () => void;
}

// Direction for slide animations
export type SlideDirection = 'up' | 'down' | 'left' | 'right';

// FadeIn specific props
export interface FadeInProps extends BaseAnimationProps {
  distance?: number; // Optional Y offset for subtle movement
}

// SlideIn specific props
export interface SlideInProps extends BaseAnimationProps {
  direction?: SlideDirection;
  distance?: number; // How far to slide (default: 30px)
}

// ScaleIn specific props
export interface ScaleInProps extends BaseAnimationProps {
  initialScale?: number; // Default: 0.8
  originX?: number; // Transform origin (0-1)
  originY?: number;
}

// PopIn specific props (playful bounce)
export interface PopInProps extends BaseAnimationProps {
  intensity?: 'subtle' | 'normal' | 'playful'; // Bounce intensity
}

// Stagger container props
export interface StaggerContainerProps extends BaseAnimationProps {
  staggerDelay?: number; // Delay between children (default: 0.1)
  as?: keyof JSX.IntrinsicElements; // Render as different element
}

// Stagger item props (must be child of StaggerContainer)
export interface StaggerItemProps extends BaseAnimationProps {
  index?: number; // Optional manual index override
}

// Page transition props
export interface PageTransitionProps extends BaseAnimationProps {
  mode?: 'fade' | 'slideUp' | 'slideDown' | 'scale';
}

// Modal transition props
export interface ModalTransitionProps extends BaseAnimationProps {
  isOpen: boolean;
  onClose?: () => void;
  closeOnBackdropClick?: boolean;
  backdropClassName?: string;
  contentClassName?: string;
}

// Card hover props
export interface CardHoverProps extends BaseAnimationProps {
  scaleAmount?: number; // Default: 1.02
  liftAmount?: number; // Y translation on hover (default: -4)
  shadowIntensity?: 'none' | 'subtle' | 'normal' | 'strong';
}

// Press animation props
export interface PressAnimationProps extends BaseAnimationProps {
  scaleAmount?: number; // Default: 0.95
  disabled?: boolean;
}

// Animated list props
export interface AnimatedListProps<T> extends Omit<StaggerContainerProps, 'children'> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T, index: number) => string | number;
  emptyComponent?: ReactNode;
}
