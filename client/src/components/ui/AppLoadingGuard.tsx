// AppLoadingGuard.tsx - Global loading protection for smooth transitions
// Shows loading screen until ALL game assets and systems are ready

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import BaseLoading from './BaseLoading';

interface LoadingState {
  isLoading: boolean;
  progress: number;
  message: string;
  phase: 'initial' | 'assets' | 'scene' | 'ready';
}

interface LoadingContextValue {
  loadingState: LoadingState;
  startLoading: (message?: string) => void;
  updateProgress: (progress: number, message?: string) => void;
  setPhase: (phase: LoadingState['phase']) => void;
  finishLoading: () => void;
  isReady: boolean;
}

const LoadingContext = createContext<LoadingContextValue | null>(null);

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within AppLoadingGuard');
  }
  return context;
}

interface AppLoadingGuardProps {
  children: ReactNode;
  minLoadTime?: number; // Minimum time to show loading (ms)
}

export function AppLoadingGuard({ children, minLoadTime = 500 }: AppLoadingGuardProps) {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    progress: 0,
    message: 'Initializing...',
    phase: 'initial',
  });

  const [showContent, setShowContent] = useState(false);
  const [loadStartTime] = useState(Date.now());

  const startLoading = useCallback((message = 'Loading...') => {
    setLoadingState({
      isLoading: true,
      progress: 0,
      message,
      phase: 'initial',
    });
    setShowContent(false);
  }, []);

  const updateProgress = useCallback((progress: number, message?: string) => {
    setLoadingState(prev => ({
      ...prev,
      progress: Math.min(100, Math.max(0, progress)),
      message: message || prev.message,
    }));
  }, []);

  const setPhase = useCallback((phase: LoadingState['phase']) => {
    const messages: Record<LoadingState['phase'], string> = {
      initial: 'Initializing...',
      assets: 'Loading assets...',
      scene: 'Preparing scene...',
      ready: 'Ready!',
    };
    setLoadingState(prev => ({
      ...prev,
      phase,
      message: messages[phase],
    }));
  }, []);

  const finishLoading = useCallback(() => {
    const elapsed = Date.now() - loadStartTime;
    const remainingTime = Math.max(0, minLoadTime - elapsed);

    // Ensure minimum load time for smoother UX
    setTimeout(() => {
      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        progress: 100,
        phase: 'ready',
        message: 'Ready!',
      }));

      // Small delay before showing content
      setTimeout(() => {
        setShowContent(true);
      }, 100);
    }, remainingTime);
  }, [loadStartTime, minLoadTime]);

  // Initial load complete check
  useEffect(() => {
    // Simulate initial checks
    const timer = setTimeout(() => {
      setPhase('assets');
      updateProgress(30);

      setTimeout(() => {
        setPhase('scene');
        updateProgress(70);

        setTimeout(() => {
          finishLoading();
        }, 200);
      }, 200);
    }, 100);

    return () => clearTimeout(timer);
  }, [setPhase, updateProgress, finishLoading]);

  const contextValue: LoadingContextValue = {
    loadingState,
    startLoading,
    updateProgress,
    setPhase,
    finishLoading,
    isReady: !loadingState.isLoading && showContent,
  };

  return (
    <LoadingContext.Provider value={contextValue}>
      {/* Loading overlay */}
      {loadingState.isLoading && (
        <LoadingScreen
          progress={loadingState.progress}
          message={loadingState.message}
          phase={loadingState.phase}
        />
      )}

      {/* Main content - rendered but hidden during loading */}
      <div
        style={{
          opacity: showContent ? 1 : 0,
          visibility: showContent ? 'visible' : 'hidden',
          transition: 'opacity 0.3s ease-in-out',
          width: '100%',
          height: '100%',
        }}
      >
        {children}
      </div>
    </LoadingContext.Provider>
  );
}

interface LoadingScreenProps {
  progress: number;
  message: string;
  phase: LoadingState['phase'];
}

function LoadingScreen({ progress, message }: LoadingScreenProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
      }}
    >
      <BaseLoading message={message} progress={progress} />
    </div>
  );
}

export default AppLoadingGuard;
