import type { BasicUserResponse, FullUserResponse } from '@shared/types/user.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * DEPRECATED: Use BasicUserResponse from @shared/types/user.types instead
 * Keeping for backward compatibility during migration
 */
export type AuthUser = BasicUserResponse;

/**
 * DEPRECATED: Use FullUserResponse from @shared/types/user.types instead
 * Keeping for backward compatibility during migration
 */
export type AuthUserData = FullUserResponse;

export interface GoogleAuthResponse {
  success: boolean;
  data: {
    user: BasicUserResponse;
    userData: FullUserResponse;
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