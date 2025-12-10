import { create } from 'zustand';

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

interface UIState {
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

export const useUIStore = create<UIState>((set, get) => ({
  // Floating texts
  floatingTexts: [],

  addFloatingText: (text) => {
    const id = 'float-' + Date.now() + Math.random();
    set((state) => ({
      floatingTexts: [...state.floatingTexts, { ...text, id }]
    }));

    // Auto-remove after animation
    setTimeout(() => {
      get().removeFloatingText(id);
    }, 1000);
  },

  removeFloatingText: (id) => {
    set((state) => ({
      floatingTexts: state.floatingTexts.filter((t) => t.id !== id)
    }));
  },

  clearFloatingTexts: () => {
    set({ floatingTexts: [] });
  },

  // Notifications
  notifications: [],

  addNotification: (notification) => {
    const id = 'notif-' + Date.now();
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id }]
    }));

    // Auto-remove after duration
    setTimeout(() => {
      get().removeNotification(id);
    }, notification.duration);
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id)
    }));
  },

  // Modal
  modal: { type: null },

  openModal: (type, data) => {
    set({ modal: { type, data } });
  },

  closeModal: () => {
    set({ modal: { type: null } });
  },

  // Loading
  isGlobalLoading: false,
  loadingMessage: '',

  setGlobalLoading: (loading, message = 'Loading...') => {
    set({ isGlobalLoading: loading, loadingMessage: message });
  },

  // Sound
  isSoundEnabled: true,
  isMusicEnabled: true,

  toggleSound: () => {
    set((state) => ({ isSoundEnabled: !state.isSoundEnabled }));
  },

  toggleMusic: () => {
    set((state) => ({ isMusicEnabled: !state.isMusicEnabled }));
  },

  // Graphics
  graphicsQuality: 'medium',

  setGraphicsQuality: (quality) => {
    set({ graphicsQuality: quality });
  },

  // Tutorial
  hasSeenTutorial: false,

  setTutorialSeen: () => {
    set({ hasSeenTutorial: true });
  },

  // Vibration
  isVibrationEnabled: true,

  toggleVibration: () => {
    set((state) => ({ isVibrationEnabled: !state.isVibrationEnabled }));
  }
}));

// Helper to show notifications
export const showNotification = (
  message: string,
  type: 'success' | 'error' | 'warning' | 'info' = 'info',
  duration = 3000
) => {
  useUIStore.getState().addNotification({ message, type, duration });
};

// Helper to show floating text
export const showFloatingText = (
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

  useUIStore.getState().addFloatingText({
    text,
    x,
    y,
    color: colors[type],
    type
  });
};
