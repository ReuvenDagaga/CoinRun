import { createContext, useContext, useState, useMemo, ReactNode, useCallback } from 'react';

interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  type: 'coin' | 'soldier' | 'damage' | 'powerup' | 'score';
}

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration: number;
}

interface Modal {
  type: 'settings' | 'pause' | 'gameover' | 'victory' | 'shop' | 'confirm' | null;
  data?: Record<string, unknown>;
}

interface UIContextValue {
  // Floating texts
  floatingTexts: FloatingText[];
  addFloatingText: (text: Omit<FloatingText, 'id'>) => void;
  removeFloatingText: (id: string) => void;
  clearFloatingTexts: () => void;

  // Notifications
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;

  // Modal
  modal: Modal;
  openModal: (type: Modal['type'], data?: Modal['data']) => void;
  closeModal: () => void;

  // Loading
  isGlobalLoading: boolean;
  loadingMessage: string;
  setGlobalLoading: (loading: boolean, message?: string) => void;

  // Sound
  isSoundEnabled: boolean;
  isMusicEnabled: boolean;
  toggleSound: () => void;
  toggleMusic: () => void;

  // Graphics quality
  graphicsQuality: 'low' | 'medium' | 'high';
  setGraphicsQuality: (quality: 'low' | 'medium' | 'high') => void;

  // Tutorial
  hasSeenTutorial: boolean;
  setTutorialSeen: () => void;

  // Vibration
  isVibrationEnabled: boolean;
  toggleVibration: () => void;
}

const UIContext = createContext<UIContextValue | undefined>(undefined);

interface UIProviderProps {
  children: ReactNode;
}

export function UIProvider({ children }: UIProviderProps) {
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [modal, setModal] = useState<Modal>({ type: null });
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isMusicEnabled, setIsMusicEnabled] = useState(true);
  const [graphicsQuality, setGraphicsQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);
  const [isVibrationEnabled, setIsVibrationEnabled] = useState(true);

  const addFloatingText = useCallback((text: Omit<FloatingText, 'id'>) => {
    const id = 'float-' + Date.now() + Math.random();
    const newText = { ...text, id };
    setFloatingTexts(prev => [...prev, newText]);

    // Auto-remove after animation
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(t => t.id !== id));
    }, 1000);
  }, []);

  const removeFloatingText = useCallback((id: string) => {
    setFloatingTexts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearFloatingTexts = useCallback(() => {
    setFloatingTexts([]);
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = 'notif-' + Date.now();
    const newNotification = { ...notification, id };
    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove after duration
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, notification.duration);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const openModal = useCallback((type: Modal['type'], data?: Modal['data']) => {
    setModal({ type, data });
  }, []);

  const closeModal = useCallback(() => {
    setModal({ type: null });
  }, []);

  const handleSetGlobalLoading = useCallback((loading: boolean, message = 'Loading...') => {
    setIsGlobalLoading(loading);
    setLoadingMessage(message);
  }, []);

  const toggleSound = useCallback(() => {
    setIsSoundEnabled(prev => !prev);
  }, []);

  const toggleMusic = useCallback(() => {
    setIsMusicEnabled(prev => !prev);
  }, []);

  const handleSetGraphicsQuality = useCallback((quality: 'low' | 'medium' | 'high') => {
    setGraphicsQuality(quality);
  }, []);

  const setTutorialSeen = useCallback(() => {
    setHasSeenTutorial(true);
  }, []);

  const toggleVibration = useCallback(() => {
    setIsVibrationEnabled(prev => !prev);
  }, []);

  const value = useMemo(
    () => ({
      floatingTexts,
      addFloatingText,
      removeFloatingText,
      clearFloatingTexts,
      notifications,
      addNotification,
      removeNotification,
      modal,
      openModal,
      closeModal,
      isGlobalLoading,
      loadingMessage,
      setGlobalLoading: handleSetGlobalLoading,
      isSoundEnabled,
      isMusicEnabled,
      toggleSound,
      toggleMusic,
      graphicsQuality,
      setGraphicsQuality: handleSetGraphicsQuality,
      hasSeenTutorial,
      setTutorialSeen,
      isVibrationEnabled,
      toggleVibration,
    }),
    [
      floatingTexts,
      addFloatingText,
      removeFloatingText,
      clearFloatingTexts,
      notifications,
      addNotification,
      removeNotification,
      modal,
      openModal,
      closeModal,
      isGlobalLoading,
      loadingMessage,
      handleSetGlobalLoading,
      isSoundEnabled,
      isMusicEnabled,
      toggleSound,
      toggleMusic,
      graphicsQuality,
      handleSetGraphicsQuality,
      hasSeenTutorial,
      setTutorialSeen,
      isVibrationEnabled,
      toggleVibration,
    ]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}

// Helper functions for convenience
export const showNotification = (
  addNotification: (notification: Omit<Notification, 'id'>) => void,
  message: string,
  type: 'success' | 'error' | 'warning' | 'info' = 'info',
  duration = 3000
) => {
  addNotification({ message, type, duration });
};

export const showFloatingText = (
  addFloatingText: (text: Omit<FloatingText, 'id'>) => void,
  text: string,
  x: number,
  y: number,
  type: FloatingText['type'] = 'score'
) => {
  const colors = {
    coin: '#FFD700',
    soldier: '#22C55E',
    damage: '#EF4444',
    powerup: '#9333EA',
    score: '#60A5FA'
  };

  addFloatingText({
    text,
    x,
    y,
    color: colors[type],
    type
  });
};
