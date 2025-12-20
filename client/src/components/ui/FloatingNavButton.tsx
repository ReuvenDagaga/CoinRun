import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

export interface FloatingNavButtonProps {
  // Position
  position: 'left' | 'right';
  top?: number | string;        // pixels or CSS value (e.g., '20%')
  bottom?: number | string;      // alternative to top

  // Content
  icon: ReactNode;
  label?: string;                // Tooltip text
  badge?: number | string;       // Notification badge

  // Action
  onClick?: () => void;
  href?: string;                 // Navigate to route
  external?: boolean;            // Open in new tab

  // Styling
  className?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;               // Pulsing animation for attention

  // State
  disabled?: boolean;
  hidden?: boolean;
}

const variantStyles = {
  primary: 'bg-blue-500 hover:bg-blue-600 text-white',
  secondary: 'bg-gray-700 hover:bg-gray-800 text-white',
  success: 'bg-green-500 hover:bg-green-600 text-white',
  warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  info: 'bg-purple-500 hover:bg-purple-600 text-white'
};

const sizeStyles = {
  sm: 'w-10 h-10 text-sm',
  md: 'w-14 h-14 text-base',
  lg: 'w-16 h-16 text-lg'
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
  variant = 'primary',
  size = 'md',
  pulse = false,
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

  // Calculate position styles
  const positionStyles: React.CSSProperties = {
    position: 'fixed',
    [position]: '1rem',
    zIndex: 40
  };

  if (top !== undefined) {
    positionStyles.top = typeof top === 'number' ? `${top}px` : top;
  } else if (bottom !== undefined) {
    positionStyles.bottom = typeof bottom === 'number' ? `${bottom}px` : bottom;
  } else {
    positionStyles.top = '50%';
    positionStyles.transform = 'translateY(-50%)';
  }

  return (
    <div
      className="group relative"
      style={positionStyles}
    >
      {/* Main Button */}
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`
          ${sizeStyles[size]}
          ${variantStyles[variant]}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-90'}
          ${pulse ? 'animate-pulse' : ''}
          rounded-full
          flex items-center justify-center
          shadow-lg hover:shadow-xl
          transition-all duration-200
          ${className}
        `}
        aria-label={label || 'Navigation button'}
      >
        {icon}

        {/* Badge */}
        {badge !== undefined && badge !== 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow-md">
            {typeof badge === 'number' && badge > 99 ? '99+' : badge}
          </span>
        )}
      </button>

      {/* Tooltip */}
      {label && (
        <div
          className={`
            absolute top-1/2 -translate-y-1/2
            ${position === 'right' ? 'right-full mr-3' : 'left-full ml-3'}
            bg-gray-900 text-white text-sm font-medium
            px-3 py-2 rounded-lg shadow-lg
            whitespace-nowrap
            opacity-0 group-hover:opacity-100
            transition-opacity duration-200
            pointer-events-none
          `}
        >
          {label}
          {/* Arrow */}
          <div
            className={`
              absolute top-1/2 -translate-y-1/2
              ${position === 'right' ? 'right-[-6px]' : 'left-[-6px]'}
              w-0 h-0
              border-t-[6px] border-t-transparent
              border-b-[6px] border-b-transparent
              ${position === 'right' ? 'border-l-[6px] border-l-gray-900' : 'border-r-[6px] border-r-gray-900'}
            `}
          />
        </div>
      )}
    </div>
  );
}
