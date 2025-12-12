const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  coins: number;
  gems: number;
}

export interface AuthUserData {
  id: string;
  username: string;
  email: string;
  avatar?: string;
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
    bestScore: number;
  };
  settings: any;
  dailyMissions: any[];
  weeklyMissions: any[];
  achievements: any[];
  activeBoosts: any[];
}

export interface GoogleAuthResponse {
  success: boolean;
  data: {
    user: AuthUser;
    userData: AuthUserData;
    token: string;
    isNewUser: boolean;
  };
}

export async function authenticateWithGoogle(credential: string): Promise<GoogleAuthResponse> {
  const response = await fetch(`${API_URL}/auth/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ credential }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Authentication failed');
  }

  return data;
}

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
  }
}

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