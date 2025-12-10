// Re-export all types from shared
export * from '@shared/types/game.types';

// Client-specific types
export interface AppState {
  isLoading: boolean;
  error: string | null;
}

export interface RouteParams {
  mode?: string;
}

export interface GamePageState {
  matchId?: string;
  betAmount?: number;
  opponent?: {
    username: string;
    powerLevel: number;
    skin: string;
  };
}
