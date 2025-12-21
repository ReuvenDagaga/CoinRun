import { ToastType } from '@/context/ToastContext';

export interface ToastStyle {
  gradient: string;
  border: string;
  shadow: string;
  icon: string;
}

// Brawl Stars style color configurations
export const TOAST_STYLES: Record<ToastType, ToastStyle> = {
  success: {
    gradient: 'from-green-500 via-emerald-400 to-green-600',
    border: 'border-green-300',
    shadow: 'shadow-green-500/50',
    icon: '✓'
  },
  error: {
    gradient: 'from-red-500 via-rose-400 to-red-600',
    border: 'border-red-300',
    shadow: 'shadow-red-500/50',
    icon: '✕'
  },
  info: {
    gradient: 'from-blue-500 via-cyan-400 to-blue-600',
    border: 'border-cyan-300',
    shadow: 'shadow-cyan-500/50',
    icon: 'ℹ'
  },
  warning: {
    gradient: 'from-orange-500 via-amber-400 to-orange-600',
    border: 'border-orange-300',
    shadow: 'shadow-orange-500/50',
    icon: '⚠'
  },
  reward: {
    gradient: 'from-yellow-400 via-amber-300 to-yellow-500',
    border: 'border-yellow-200',
    shadow: 'shadow-yellow-400/60',
    icon: '★'
  }
};

export const TOAST_DEFAULTS = {
  duration: 3000,
  animationDuration: 300
};
