// Export all contexts and their providers
export { AuthProvider } from './AuthContext';
export { UserProvider, useUser } from './UserContext';
export { GameProvider, useGame } from './GameContext';
export { UIProvider, useUI, showNotification, showFloatingText } from './UIContext';

// Export types
export type { SpeedEffect } from './GameContext';
