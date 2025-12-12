// Authentication service for handling Google OAuth and user authentication

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface GoogleAuthResponse {
  user: {
    id: string;
    email: string;
    username: string;
    name: string;
    picture?: string;
  };
  userData: {
    id: string;
    username: string;
    email: string;
    usdtBalance: number;
    coins: number;
    gems: number;
    currentSkin: string;
    ownedSkins: string[];
    upgrades: {
      capacity: number;
      addWarrior: number;
      warriorUpgrade: number;
      income: number;
      speed: number;
      jump: number;
      bulletPower: number;
      magnetRadius: number;
    };
    stats: {
      gamesPlayed: number;
      gamesWon: number;
      totalDistance: number;
      totalCoinsCollected: number;
      highestArmy: number;
    };
    dailyMissionsCompleted: string[];
    lastDailyReward: string | null;
    spinUsedToday: boolean;
    dailyStreak: number;
    achievements: any[];
  };
  token: string;
  isNewUser: boolean;
}

/**
 * Authenticate user with Google OAuth credential
 * Sends Google credential to backend for verification
 * Backend creates/retrieves user and returns user data
 */
export async function authenticateWithGoogle(credential: string): Promise<GoogleAuthResponse> {
  try {
    const response = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ credential }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Authentication failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Google authentication error:', error);
    throw error;
  }
}

/**
 * Logout user - clears token from server if needed
 */
export async function logout(token: string): Promise<void> {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('Logout error:', error);
    // Continue with logout even if server request fails
  }
}

/**
 * Verify token is still valid
 */
export async function verifyToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Token verification error:', error);
    return false;
  }
}
