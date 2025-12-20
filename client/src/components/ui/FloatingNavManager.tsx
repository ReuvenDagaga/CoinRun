import { ReactNode } from 'react';
import FloatingNavButton, { FloatingNavButtonProps } from './FloatingNavButton';

export interface FloatingNavConfig extends Omit<FloatingNavButtonProps, 'position' | 'top'> {
  id: string;
  enabled?: boolean;  // Can be toggled on/off
}

export interface FloatingNavManagerProps {
  leftButtons?: FloatingNavConfig[];
  rightButtons?: FloatingNavConfig[];
  baseTopOffset?: number;  // Starting position from top
  spacing?: number;        // Spacing between buttons
}

/**
 * FloatingNavManager - Manages multiple floating navigation buttons
 * Automatically stacks buttons vertically with proper spacing
 */
export default function FloatingNavManager({
  leftButtons = [],
  rightButtons = [],
  baseTopOffset = 120,
  spacing = 70
}: FloatingNavManagerProps) {
  // Filter enabled buttons
  const enabledLeftButtons = leftButtons.filter(btn => btn.enabled !== false);
  const enabledRightButtons = rightButtons.filter(btn => btn.enabled !== false);

  return (
    <>
      {/* Left Side Buttons */}
      {enabledLeftButtons.map((button, index) => (
        <FloatingNavButton
          key={button.id}
          {...button}
          position="left"
          top={baseTopOffset + index * spacing}
        />
      ))}

      {/* Right Side Buttons */}
      {enabledRightButtons.map((button, index) => (
        <FloatingNavButton
          key={button.id}
          {...button}
          position="right"
          top={baseTopOffset + index * spacing}
        />
      ))}
    </>
  );
}
