import { useEffect, useState } from 'react';
import TextWithShadow from '@/components/TextWithShadow';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ 
  message, 
  type = 'info', 
  isVisible, 
  onClose, 
  duration = 3000 
}: ToastProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(onClose, 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible && !isAnimating) return null;

  const buttonImage = type === 'success' 
    ? '/ui/Button/Green_.Png' 
    : type === 'error' 
      ? '/ui/Button/Red_.Png' 
      : '/ui/Button/Red_.Png';

  return (
    <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${
      isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
    }`}>
      <div
        className="relative flex items-center justify-center px-8 py-4 min-w-[200px]"
        style={{
          backgroundImage: `url('${buttonImage}')`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <TextWithShadow className="text-white font-bold text-lg text-center">
          {message}
        </TextWithShadow>
      </div>
    </div>
  );
}