import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { CLIENT_CONSTANTS } from '@/lib/constants';
import { chestsApi } from '@/services/api';
import { ChestTier } from '@shared/interface/IChest';

interface ChestStatus {
  tier: ChestTier;
  isReady: boolean;
  availableIn: number;
  availableAt: Date;
  claimed: boolean;
}

interface ChestReward {
  cards: Array<{
    cardId: string;
    rarity: string;
    isDuplicate: boolean;
    conversionReward?: { coins: number; gems: number };
  }>;
  coins: number;
  gems: number;
}

interface UseChestTimerReturn {
  status: ChestStatus | null;
  countdown: number;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  claimChest: () => Promise<ChestReward | null>;
  refreshStatus: () => Promise<void>;
}

export function useChestTimer(token: string | null): UseChestTimerReturn {
  const [status, setStatus] = useState<ChestStatus | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Setup socket connection
  useEffect(() => {
    if (!token) {
      // Cleanup on logout
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setStatus(null);
      setCountdown(0);
      return;
    }

    const socket = io(`${CLIENT_CONSTANTS.API_BASE_URL.replace('/api', '')}/chests`, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('Connected to chest timer socket');
    });

    socket.on('chest:status', (data: ChestStatus) => {
      setStatus(data);
      const secondsRemaining = Math.ceil(data.availableIn / 1000);
      setCountdown(Math.max(0, secondsRemaining));
    });

    socket.on('chest:ready', (data: { tier: ChestTier }) => {
      setStatus(prev => prev ? { ...prev, isReady: true, tier: data.tier } : null);
      setCountdown(0);
    });

    socket.on('connect_error', (err) => {
      console.error('Chest socket connection error:', err);
      setError('Failed to connect to chest timer');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from chest timer socket');
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      return;
    }

    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        const newValue = Math.max(0, prev - 1);
        if (newValue === 0 && status) {
          setStatus({ ...status, isReady: true });
        }
        return newValue;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [countdown > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh status via API (fallback)
  const refreshStatus = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await chestsApi.getStatus() as any;
      if (response.data) {
        setStatus(response.data);
        const secondsRemaining = Math.ceil(response.data.availableIn / 1000);
        setCountdown(Math.max(0, secondsRemaining));
      }
    } catch (err: any) {
      console.error('Failed to get chest status:', err);
      setError(err.message || 'Failed to get chest status');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Claim chest
  const claimChest = useCallback(async (): Promise<ChestReward | null> => {
    if (!status?.isReady || !token) return null;
    setIsLoading(true);
    setError(null);
    try {
      const response = await chestsApi.claim() as any;
      if (response.data) {
        // Update status with new chest timer
        if (response.data.newStatus) {
          setStatus(response.data.newStatus);
          const secondsRemaining = Math.ceil(response.data.newStatus.availableIn / 1000);
          setCountdown(Math.max(0, secondsRemaining));
        }
        return response.data.reward;
      }
      return null;
    } catch (err: any) {
      console.error('Failed to claim chest:', err);
      setError(err.message || 'Failed to claim chest');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [status?.isReady, token]);

  return {
    status,
    countdown,
    isReady: status?.isReady ?? false,
    isLoading,
    error,
    claimChest,
    refreshStatus
  };
}

// Format countdown to MM:SS
export function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
