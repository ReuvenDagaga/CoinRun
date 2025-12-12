import { CLIENT_CONSTANTS } from '@/utils/constants';

const API_BASE = CLIENT_CONSTANTS.API_BASE_URL;

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

  getLeaderboard: (type: 'daily' | 'weekly' | 'alltime' = 'daily') =>
    apiRequest(`/runner/leaderboard?type=${type}`),

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

  buyGems: (usdtAmount: number) =>
    apiRequest('/shop/buy/gems', {
      method: 'POST',
      body: { usdtAmount },
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

export default {
  auth: authApi,
  runner: runnerApi,
  upgrades: upgradesApi,
  shop: shopApi,
  daily: dailyApi,
  wallet: walletApi
};
