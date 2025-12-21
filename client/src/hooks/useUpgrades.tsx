import { useContext, useCallback, useMemo } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { IUpgrades } from '@shared/interface/IUpgrades';
import { calculatePowerLevel, calculateUpgradeCost, GAME_CONSTANTS } from '@shared/types/game.types';

interface UseUpgradesReturn {
  upgrades: IUpgrades | null;
  powerLevel: number;
  getUpgradeCost: (type: keyof IUpgrades) => number;
  canAffordUpgrade: (type: keyof IUpgrades) => boolean;
  isMaxLevel: (type: keyof IUpgrades) => boolean;
  purchaseUpgrade: (type: keyof IUpgrades) => Promise<boolean>;
}

export function useUpgrades(): UseUpgradesReturn {
  const auth = useContext(AuthContext);

  if (!auth) {
    throw new Error('useUpgrades must be used within an AuthProvider');
  }

  const { user, updateUser } = auth;

  const upgrades = user?.upgrades ?? null;

  const powerLevel = useMemo(() => {
    if (!upgrades) return 0;
    return calculatePowerLevel(upgrades);
  }, [upgrades]);

  const getUpgradeCost = useCallback((type: keyof IUpgrades): number => {
    if (!upgrades) return 0;
    return calculateUpgradeCost(type, upgrades[type]);
  }, [upgrades]);

  const canAffordUpgrade = useCallback((type: keyof IUpgrades): boolean => {
    if (!user) return false;
    return user.coins >= getUpgradeCost(type);
  }, [user, getUpgradeCost]);

  const isMaxLevel = useCallback((type: keyof IUpgrades): boolean => {
    if (!upgrades) return false;
    const maxLevel = GAME_CONSTANTS.MAX_LEVELS[type];
    return upgrades[type] >= maxLevel;
  }, [upgrades]);

  const purchaseUpgrade = useCallback(async (type: keyof IUpgrades): Promise<boolean> => {
    if (!user || !canAffordUpgrade(type) || isMaxLevel(type)) return false;

    const cost = getUpgradeCost(type);
    const newUpgrades = { ...user.upgrades, [type]: user.upgrades[type] + 1 };

    try {
      await updateUser({
        coins: user.coins - cost,
        upgrades: newUpgrades
      });
      return true;
    } catch {
      return false;
    }
  }, [user, canAffordUpgrade, isMaxLevel, getUpgradeCost, updateUser]);

  return {
    upgrades,
    powerLevel,
    getUpgradeCost,
    canAffordUpgrade,
    isMaxLevel,
    purchaseUpgrade,
  };
}

export default useUpgrades;
