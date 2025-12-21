import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import TextWithShadow from '@/components/TextWithShadow';

interface BasePopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  headerColor?: string;
  size?: 'sm' | 'md' | 'lg';
  showCloseButton?: boolean;
}

const sizeClasses = {
  sm: 'max-w-xs',
  md: 'max-w-sm',
  lg: 'max-w-md',
};

export default function BasePopup({
  isOpen,
  onClose,
  title,
  children,
  headerColor = 'from-yellow-500 to-yellow-600',
  size = 'md',
  showCloseButton = true,
}: BasePopupProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
      document.body.style.overflow = 'hidden';
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 200);
      document.body.style.overflow = '';
      return () => clearTimeout(timer);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!shouldRender) return null;

  const popup = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 99999 }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-200 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Popup Container */}
      <div
        className={`relative w-full ${sizeClasses[size]} transition-all duration-200 ease-out ${
          isAnimating
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-90 translate-y-4'
        }`}
        style={{ maxHeight: '65vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Outer glow border */}
        <div className="absolute -inset-1 bg-gradient-to-r from-white/20 to-white/10 rounded-3xl blur-sm" />

        {/* Main popup */}
        <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl overflow-hidden border border-white/10">
          {/* Header */}
          <div className={`relative bg-gradient-to-r ${headerColor} px-4 py-3`}>
            <TextWithShadow as="h2" className="text-white font-bold text-lg text-center pr-8">
              {title}
            </TextWithShadow>

            {/* Close button */}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="absolute top-1/2 right-3 -translate-y-1/2 w-8 h-8 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
              >
                <img
                  src="/ui/Close.Png"
                  alt="Close"
                  className="w-7 h-7 drop-shadow-lg"
                  onError={(e) => {
                    // Fallback if image doesn't exist
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<span class="text-white text-2xl font-bold">×</span>';
                  }}
                />
              </button>
            )}
          </div>

          {/* Content */}
          <div
            className="overflow-y-auto overscroll-contain"
            style={{ maxHeight: 'calc(65vh - 52px)' }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(popup, document.body);
}
