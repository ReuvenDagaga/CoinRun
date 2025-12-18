// GameTransitionGuard.tsx - Handles loading screens during game transitions
// Prevents visual glitches when starting, ending, or restarting games

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import BaseLoading from './BaseLoading';

type TransitionType = 'starting' | 'ending' | 'restarting' | 'none';

interface GameTransitionState {
  isTransitioning: boolean;
  type: TransitionType;
  progress: number;
  message: string;
}

interface GameTransitionContextValue {
  transitionState: GameTransitionState;
  startGameTransition: () => Promise<void>;
  endGameTransition: () => Promise<void>;
  restartGameTransition: () => Promise<void>;
  completeTransition: () => void;
  isTransitioning: boolean;
}

const GameTransitionContext = createContext<GameTransitionContextValue | null>(null);

export function useGameTransition() {
  const context = useContext(GameTransitionContext);
  if (!context) {
    throw new Error('useGameTransition must be used within GameTransitionGuard');
  }
  return context;
}

interface GameTransitionGuardProps {
  children: ReactNode;
  transitionDuration?: number; // Minimum transition time in ms
}

export function GameTransitionGuard({ children, transitionDuration = 800 }: GameTransitionGuardProps) {
  const [transitionState, setTransitionState] = useState<GameTransitionState>({
    isTransitioning: false,
    type: 'none',
    progress: 0,
    message: '',
  });

  const [contentVisible, setContentVisible] = useState(true);

  // Progress animation
  useEffect(() => {
    if (!transitionState.isTransitioning) return;

    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      if (progress <= 100) {
        setTransitionState(prev => ({ ...prev, progress }));
      }
    }, transitionDuration / 20);

    return () => clearInterval(interval);
  }, [transitionState.isTransitioning, transitionDuration]);

  const startTransition = useCallback(async (type: TransitionType, message: string) => {
    setContentVisible(false);
    setTransitionState({
      isTransitioning: true,
      type,
      progress: 0,
      message,
    });

    // Wait for fade out
    await new Promise(resolve => setTimeout(resolve, 150));

    return new Promise<void>(resolve => {
      setTimeout(() => {
        resolve();
      }, transitionDuration);
    });
  }, [transitionDuration]);

  const startGameTransition = useCallback(async () => {
    await startTransition('starting', 'Starting game...');
  }, [startTransition]);

  const endGameTransition = useCallback(async () => {
    await startTransition('ending', 'Calculating results...');
  }, [startTransition]);

  const restartGameTransition = useCallback(async () => {
    await startTransition('restarting', 'Restarting...');
  }, [startTransition]);

  const completeTransition = useCallback(() => {
    setTransitionState(prev => ({
      ...prev,
      progress: 100,
    }));

    // Fade in content
    setTimeout(() => {
      setTransitionState({
        isTransitioning: false,
        type: 'none',
        progress: 0,
        message: '',
      });
      setContentVisible(true);
    }, 200);
  }, []);

  const contextValue: GameTransitionContextValue = {
    transitionState,
    startGameTransition,
    endGameTransition,
    restartGameTransition,
    completeTransition,
    isTransitioning: transitionState.isTransitioning,
  };

  return (
    <GameTransitionContext.Provider value={contextValue}>
      {/* Transition overlay */}
      {transitionState.isTransitioning && (
        <TransitionOverlay
          type={transitionState.type}
          progress={transitionState.progress}
          message={transitionState.message}
        />
      )}

      {/* Main content */}
      <div
        style={{
          opacity: contentVisible ? 1 : 0,
          transition: 'opacity 0.15s ease-out',
          width: '100%',
          height: '100%',
        }}
      >
        {children}
      </div>
    </GameTransitionContext.Provider>
  );
}

interface TransitionOverlayProps {
  type: TransitionType;
  progress: number;
  message: string;
}

function TransitionOverlay({ progress, message }: TransitionOverlayProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10000,
      }}
    >
      <BaseLoading message={message} progress={progress} />
    </div>
  );
}

export default GameTransitionGuard;
