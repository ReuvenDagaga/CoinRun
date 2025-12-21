import { useEffect, useState } from 'react';
import TextWithShadow from '@/components/TextWithShadow';
import { ToastType } from '@/context/ToastContext';
import { TOAST_STYLES, TOAST_DEFAULTS } from './config';

interface ToastProps {
  message: string;
  type?: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({
  message,
  type = 'info',
  isVisible,
  onClose,
  duration = TOAST_DEFAULTS.duration
}: ToastProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(onClose, TOAST_DEFAULTS.animationDuration);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible && !isAnimating) return null;

  const style = TOAST_STYLES[type];

  return (
    <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${
      isAnimating ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'
    }`}>
      <div
        className={`
          relative flex items-center gap-3 px-6 py-4 min-w-[220px] max-w-[90vw]
          bg-gradient-to-r ${style.gradient}
          rounded-2xl border-4 ${style.border}
          shadow-lg ${style.shadow}
        `}
      >
        {/* Decorative top shine */}
        <div className="absolute inset-x-2 top-1 h-2 bg-white/30 rounded-full blur-sm" />

        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border-2 border-white/40">
          <span className="text-white text-xl font-bold drop-shadow-lg">{style.icon}</span>
        </div>

        {/* Message */}
        <TextWithShadow className="text-white font-bold text-xl text-center flex-1">
          {message}
        </TextWithShadow>

        {/* Decorative bottom shadow */}
        <div className="absolute inset-x-4 -bottom-1 h-2 bg-black/20 rounded-full blur-sm" />
      </div>
    </div>
  );
}
