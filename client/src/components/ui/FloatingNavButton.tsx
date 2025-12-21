import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

export interface FloatingNavButtonProps {
  position: 'left' | 'right';
  top?: number | string;
  bottom?: number | string;
  icon: ReactNode;
  label?: string;
  badge?: number | string;
  onClick?: () => void;
  href?: string;
  external?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  hidden?: boolean;
}

const sizeStyles = {
  sm: 'w-8 h-8 text-lg',
  md: 'w-12 h-12 text-xl',
  lg: 'w-14 h-14 text-2xl'
};

export default function FloatingNavButton({
  position,
  top,
  bottom,
  icon,
  label,
  badge,
  onClick,
  href,
  external,
  className = '',
  size = 'md',
  disabled = false,
  hidden = false
}: FloatingNavButtonProps) {
  const navigate = useNavigate();

  if (hidden) return null;

  const handleClick = () => {
    if (disabled) return;
    if (onClick) {
      onClick();
    } else if (href) {
      if (external) {
        window.open(href, '_blank');
      } else {
        navigate(href);
      }
    }
  };

  // מיקום הכפתור על המסך
  const positionStyles: React.CSSProperties = {
    position: 'fixed',
    [position]: '1rem',
    zIndex: 40
  };

  // גובה - אם לא צוין, ממורכז אנכית
  if (top !== undefined) {
    positionStyles.top = typeof top === 'number' ? `${top}px` : top;
  } else if (bottom !== undefined) {
    positionStyles.bottom = typeof bottom === 'number' ? `${bottom}px` : bottom;
  } else {
    positionStyles.top = '50%';
    positionStyles.transform = 'translateY(-50%)';
  }

  return (
    <div className="group" style={positionStyles}>
      {/* כפתור שקוף - רק האייקון */}
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`
          ${sizeStyles[size]}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-90'}
          bg-transparent
          flex items-center justify-center
          transition-transform duration-200
          ${className}
        `}
        aria-label={label}
      >
        {icon}

        {/* Badge - עיגול אדום עם מספר */}
        {badge !== undefined && badge !== 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
            {typeof badge === 'number' && badge > 99 ? '99+' : badge}
          </span>
        )}
      </button>
    </div>
  );
}
