import React from 'react';
import { motion } from 'framer-motion';

interface AssetButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'gold';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  icon?: string;
  className?: string;
}

// Casual game style button with 3D effect (Brawl Stars / Clash Royale style)
const AssetButton: React.FC<AssetButtonProps> = ({
  label,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  icon,
  className = ''
}) => {
  // Color schemes for variants
  const variants = {
    primary: {
      bg: 'linear-gradient(180deg, #FF6B35 0%, #E85A25 50%, #D04A15 100%)',
      border: '#8B2500',
      shadow: '#CD4F00',
      text: '#FFFFFF'
    },
    secondary: {
      bg: 'linear-gradient(180deg, #4ECDC4 0%, #3DBDB5 50%, #2DADA6 100%)',
      border: '#1D7D76',
      shadow: '#2D9D96',
      text: '#FFFFFF'
    },
    success: {
      bg: 'linear-gradient(180deg, #32CD32 0%, #28B728 50%, #1EA71E 100%)',
      border: '#0E870E',
      shadow: '#1E9D1E',
      text: '#FFFFFF'
    },
    danger: {
      bg: 'linear-gradient(180deg, #FF6B6B 0%, #E85555 50%, #D04545 100%)',
      border: '#8B2525',
      shadow: '#CD3535',
      text: '#FFFFFF'
    },
    gold: {
      bg: 'linear-gradient(180deg, #FFD700 0%, #E8C400 50%, #D0B100 100%)',
      border: '#8B7500',
      shadow: '#CDA500',
      text: '#333333'
    }
  };

  const sizes = {
    small: {
      height: '40px',
      padding: '0 16px',
      fontSize: '14px',
      borderRadius: '10px',
      borderWidth: '3px'
    },
    medium: {
      height: '56px',
      padding: '0 24px',
      fontSize: '18px',
      borderRadius: '14px',
      borderWidth: '4px'
    },
    large: {
      height: '72px',
      padding: '0 32px',
      fontSize: '24px',
      borderRadius: '18px',
      borderWidth: '5px'
    }
  };

  const style = variants[variant];
  const sizeStyle = sizes[size];

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.05 } : undefined}
      whileTap={!disabled ? { scale: 0.95 } : undefined}
      onClick={!disabled ? onClick : undefined}
      className={className}
      style={{
        background: disabled ? '#666666' : style.bg,
        border: 'none',
        borderBottom: `${sizeStyle.borderWidth} solid ${disabled ? '#444444' : style.border}`,
        borderRadius: sizeStyle.borderRadius,
        height: sizeStyle.height,
        padding: sizeStyle.padding,
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: disabled
          ? 'none'
          : `0 4px 12px ${style.shadow}50, inset 0 1px 0 rgba(255,255,255,0.3)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.15s ease'
      }}
    >
      {/* Shine effect */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 100%)',
          borderTopLeftRadius: sizeStyle.borderRadius,
          borderTopRightRadius: sizeStyle.borderRadius,
          pointerEvents: 'none'
        }}
      />

      {/* Icon */}
      {icon && (
        <span style={{ fontSize: sizeStyle.fontSize }}>{icon}</span>
      )}

      {/* Text with outline effect */}
      <span
        style={{
          color: style.text,
          fontSize: sizeStyle.fontSize,
          fontWeight: 'bold',
          fontFamily: '"Comic Sans MS", "Bangers", sans-serif',
          textShadow: '2px 2px 0 rgba(0,0,0,0.3), -1px -1px 0 rgba(0,0,0,0.3)',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          position: 'relative',
          zIndex: 1
        }}
      >
        {label}
      </span>
    </motion.button>
  );
};

// Small circular button for actions
export const CircleButton: React.FC<{
  icon: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: number;
}> = ({ icon, onClick, variant = 'primary', size = 48 }) => {
  const colors = {
    primary: { bg: '#FF6B35', border: '#D04A15' },
    secondary: { bg: '#4ECDC4', border: '#2DADA6' },
    danger: { bg: '#FF6B6B', border: '#D04545' }
  };

  const style = colors[variant];

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `linear-gradient(180deg, ${style.bg} 0%, ${style.border} 100%)`,
        border: 'none',
        borderBottom: `3px solid ${style.border}`,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.5,
        boxShadow: `0 4px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)`
      }}
    >
      {icon}
    </motion.button>
  );
};

// Card-style panel for UI sections
export const GamePanel: React.FC<{
  children: React.ReactNode;
  title?: string;
  className?: string;
}> = ({ children, title, className = '' }) => {
  return (
    <div
      className={className}
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
        borderRadius: '16px',
        border: '3px solid rgba(255,255,255,0.2)',
        padding: '16px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}
    >
      {title && (
        <h3
          style={{
            color: '#FFFFFF',
            fontSize: '20px',
            fontWeight: 'bold',
            fontFamily: '"Comic Sans MS", "Bangers", sans-serif',
            textShadow: '2px 2px 0 rgba(0,0,0,0.5)',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
        >
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};

// Stat display with icon
export const StatDisplay: React.FC<{
  icon: string;
  value: string | number;
  label?: string;
  color?: string;
}> = ({ icon, value, label, color = '#FFD700' }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(0,0,0,0.3)',
        padding: '8px 12px',
        borderRadius: '12px',
        border: `2px solid ${color}40`
      }}
    >
      <span style={{ fontSize: '20px' }}>{icon}</span>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span
          style={{
            color: '#FFFFFF',
            fontSize: '18px',
            fontWeight: 'bold',
            fontFamily: '"Comic Sans MS", sans-serif',
            textShadow: '1px 1px 0 rgba(0,0,0,0.5)'
          }}
        >
          {value}
        </span>
        {label && (
          <span
            style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '10px',
              textTransform: 'uppercase'
            }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
};

export default AssetButton;
