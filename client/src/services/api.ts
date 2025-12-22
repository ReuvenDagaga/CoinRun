import { CLIENT_CONSTANTS } from '@/lib/constants';

const API_BASE = CLIENT_CONSTANTS.API_BASE_URL;

// Leaderboard types
export interface LeaderboardEntry {
  rank: number;
  oderId: string;
  username: string;
  avatar: string | null;
  powerLevel: number;
  skin: string;
}

export interface LeaderboardRewardTier {
  rank: number | string;
  coins: number;
  gems: number;
  chest: 'legendary' | 'simple';
}

export interface LeaderboardResponse {
  data: {
    leaderboard: LeaderboardEntry[];
    currentUser: LeaderboardEntry | null;
    rewardInfo: {
      rewards: LeaderboardRewardTier[];
      nextReset: string;
      timeUntilReset: { hours: number; minutes: number; seconds: number };
    };
  };
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
  token?: string;
}

async function apiRequest<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

// Get token from localStorage
function getToken(): string | null {
  return localStorage.getItem('token');
}

// Auth API
export const authApi = {
  register: (username: string, email?: string, password?: string) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: { username, email, password }
    }),

  login: (username: string, password: string) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: { username, password }
    }),

  googleAuth: (googleId: string, email: string, name: string) =>
    apiRequest('api/auth/google', {
      method: 'POST',
      body: { googleId, email, name }
    }),

  getCurrentUser: () =>
    apiRequest('api/auth/me', {
      token: getToken() || undefined
    }),

  logout: () =>
    apiRequest('api/auth/logout', {
      method: 'POST',
      token: getToken() || undefined
    })
};

// Runner Game API
export const runnerApi = {
  startSolo: () =>
    apiRequest('/runner/solo', {
      method: 'POST',
      token: getToken() || undefined
    }),

  finishSolo: (gameId: string, result: Record<string, unknown>) =>
    apiRequest('/runner/solo/finish', {
      method: 'POST',
      body: { gameId, result },
      token: getToken() || undefined
    }),

  getLeaderboard: () =>
    apiRequest<LeaderboardResponse>('/runner/leaderboard', {
      token: getToken() || undefined
    }),

  getStats: () =>
    apiRequest('/runner/stats', {
      token: getToken() || undefined
    })
};

// Upgrades API
export const upgradesApi = {
  getAll: () =>
    apiRequest('/upgrades', {
      token: getToken() || undefined
    }),

  purchase: (type: string) =>
    apiRequest(`/upgrades/${type}`, {
      method: 'POST',
      token: getToken() || undefined
    })
};

// Shop API
export const shopApi = {
  getSkins: () =>
    apiRequest('/shop/skins'),

  buySkin: (skinId: string) =>
    apiRequest('/shop/buy/skin', {
      method: 'POST',
      body: { skinId },
      token: getToken() || undefined
    }),

  equipSkin: (skinId: string) =>
    apiRequest('/shop/equip/skin', {
      method: 'POST',
      body: { skinId },
      token: getToken() || undefined
    }),

  buyLootbox: (type: 'bronze' | 'silver' | 'gold') =>
    apiRequest('/shop/buy/lootbox', {
      method: 'POST',
      body: { type },
      token: getToken() || undefined
    }),

  buyGems: (amount: number) =>
    apiRequest('/shop/buy/gems', {
      method: 'POST',
      body: { amount },
      token: getToken() || undefined
    })
};

// Daily API
export const dailyApi = {
  claimLogin: () =>
    apiRequest('/daily/login', {
      method: 'POST',
      token: getToken() || undefined
    }),

  spin: () =>
    apiRequest('/daily/spin', {
      method: 'POST',
      token: getToken() || undefined
    })
};

// Wallet API
export const walletApi = {
  getBalance: () =>
    apiRequest('/wallet/balance', {
      token: getToken() || undefined
    }),

  getTransactions: () =>
    apiRequest('/wallet/transactions', {
      token: getToken() || undefined
    })
};

// Cards API
export const cardsApi = {
  // Get user's card collection
  getAll: () =>
    apiRequest('/cards', {
      token: getToken() || undefined
    }),

  // Upgrade a card's star level
  upgrade: (cardId: string) =>
    apiRequest('/cards/upgrade', {
      method: 'POST',
      body: { cardId },
      token: getToken() || undefined
    }),

  // Get all available cards info (public)
  getPool: () =>
    apiRequest('/cards/pool')
};

// Chests API
export const chestsApi = {
  // Get current timed chest status
  getStatus: () =>
    apiRequest('/chests/status', {
      token: getToken() || undefined
    }),

  // Claim the ready timed chest
  claim: () =>
    apiRequest('/chests/claim', {
      method: 'POST',
      token: getToken() || undefined
    }),

  // Purchase a chest with gems
  buy: (tier: 'bronze' | 'silver' | 'gold') =>
    apiRequest('/chests/buy', {
      method: 'POST',
      body: { tier },
      token: getToken() || undefined
    }),

  // Get chest history
  getHistory: (limit?: number) =>
    apiRequest(`/chests/history${limit ? `?limit=${limit}` : ''}`, {
      token: getToken() || undefined
    }),

  // Get drop rates info (public)
  getRates: () =>
    apiRequest('/chests/rates')
};

export default {
  auth: authApi,
  runner: runnerApi,
  upgrades: upgradesApi,
  shop: shopApi,
  daily: dailyApi,
  wallet: walletApi,
  cards: cardsApi,
  chests: chestsApi
};
