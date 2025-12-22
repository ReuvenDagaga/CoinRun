// WeaponContext.tsx - Manages weapon state, bullets, and shooting
import { createContext, useContext, useState, useCallback, useMemo, ReactNode, useRef } from 'react';
import { BulletData, WeaponTier, WEAPON_CONFIGS, getWeaponTier, BULLET_LIFETIME, BULLET_Y_OFFSET } from '@/components/game/weapons/types';
import { GAME_CONSTANTS } from '@shared/types/game.types';

interface WeaponContextValue {
  // Weapon state
  weaponTier: WeaponTier;
  temporaryWeaponBoost: number; // Temporary boost from WEAPON_POWER gate
  effectiveWeaponTier: WeaponTier;

  // Bullets
  bullets: BulletData[];

  // Actions
  setWeaponTier: (tier: WeaponTier) => void;
  applyTemporaryBoost: (boost: number) => void;
  clearTemporaryBoost: () => void;
  fireBullet: (
    sourceIndex: number,
    position: { x: number; y: number; z: number },
    playerSpeed: number
  ) => void;
  updateBullets: (delta: number, playerZ: number) => void;
  removeBullet: (bulletId: string) => void;
  clearAllBullets: () => void;
  getBulletDamage: () => number;
}

const WeaponContext = createContext<WeaponContextValue | undefined>(undefined);

interface WeaponProviderProps {
  children: ReactNode;
  powerLevel: number;
}

export function WeaponProvider({ children, powerLevel }: WeaponProviderProps) {
  const [weaponTier, setWeaponTierState] = useState<WeaponTier>(() => getWeaponTier(powerLevel));
  const [temporaryWeaponBoost, setTemporaryWeaponBoost] = useState(0);
  const [bullets, setBullets] = useState<BulletData[]>([]);

  const bulletIdCounter = useRef(0);

  // Calculate effective weapon tier with boost
  const effectiveWeaponTier = useMemo(() => {
    const boostedTier = Math.min(10, weaponTier + Math.floor(temporaryWeaponBoost));
    return boostedTier as WeaponTier;
  }, [weaponTier, temporaryWeaponBoost]);

  const setWeaponTier = useCallback((tier: WeaponTier) => {
    setWeaponTierState(tier);
  }, []);

  const applyTemporaryBoost = useCallback((boost: number) => {
    setTemporaryWeaponBoost((prev) => Math.min(9, prev + boost)); // Max boost can bring to tier 10
  }, []);

  const clearTemporaryBoost = useCallback(() => {
    setTemporaryWeaponBoost(0);
  }, []);

  const fireBullet = useCallback(
    (
      sourceIndex: number,
      position: { x: number; y: number; z: number },
      playerSpeed: number
    ) => {
      const config = WEAPON_CONFIGS[effectiveWeaponTier];
      const bulletSpeed = playerSpeed * config.bulletSpeed;

      const newBullet: BulletData = {
        id: `bullet-${bulletIdCounter.current++}`,
        position: {
          x: position.x,
          y: position.y + BULLET_Y_OFFSET,
          z: position.z,
        },
        velocity: {
          x: 0,
          y: 0,
          z: bulletSpeed, // Forward direction
        },
        damage: config.damage,
        size: config.bulletSize,
        color: config.bulletColor,
        sourceIndex,
        createdAt: Date.now(),
      };

      setBullets((prev) => [...prev, newBullet]);
    },
    [effectiveWeaponTier]
  );

  const updateBullets = useCallback((delta: number, playerZ: number) => {
    const now = Date.now();

    setBullets((prev) => {
      // Update positions and filter out expired/distant bullets
      return prev
        .map((bullet) => ({
          ...bullet,
          position: {
            x: bullet.position.x + bullet.velocity.x * delta,
            y: bullet.position.y + bullet.velocity.y * delta,
            z: bullet.position.z + bullet.velocity.z * delta,
          },
        }))
        .filter((bullet) => {
          // Remove bullets that are too old
          if (now - bullet.createdAt > BULLET_LIFETIME) return false;

          // Remove bullets that are too far behind player
          if (bullet.position.z < playerZ - 20) return false;

          // Remove bullets that are way too far ahead
          if (bullet.position.z > playerZ + 200) return false;

          return true;
        });
    });
  }, []);

  const removeBullet = useCallback((bulletId: string) => {
    setBullets((prev) => prev.filter((b) => b.id !== bulletId));
  }, []);

  const clearAllBullets = useCallback(() => {
    setBullets([]);
  }, []);

  const getBulletDamage = useCallback(() => {
    return WEAPON_CONFIGS[effectiveWeaponTier].damage;
  }, [effectiveWeaponTier]);

  const value = useMemo(
    () => ({
      weaponTier,
      temporaryWeaponBoost,
      effectiveWeaponTier,
      bullets,
      setWeaponTier,
      applyTemporaryBoost,
      clearTemporaryBoost,
      fireBullet,
      updateBullets,
      removeBullet,
      clearAllBullets,
      getBulletDamage,
    }),
    [
      weaponTier,
      temporaryWeaponBoost,
      effectiveWeaponTier,
      bullets,
      setWeaponTier,
      applyTemporaryBoost,
      clearTemporaryBoost,
      fireBullet,
      updateBullets,
      removeBullet,
      clearAllBullets,
      getBulletDamage,
    ]
  );

  return <WeaponContext.Provider value={value}>{children}</WeaponContext.Provider>;
}

export function useWeapons() {
  const context = useContext(WeaponContext);
  if (context === undefined) {
    throw new Error('useWeapons must be used within a WeaponProvider');
  }
  return context;
}

// Hook for managing shooting timer per soldier
export function useSoldierShooting() {
  const lastFireTimeRef = useRef<Map<number, number>>(new Map());

  const canFire = useCallback((soldierIndex: number, fireRate: number): boolean => {
    const now = Date.now();
    const lastFire = lastFireTimeRef.current.get(soldierIndex) || 0;
    const fireInterval = 1000 / fireRate; // Convert rate to interval in ms

    return now - lastFire >= fireInterval;
  }, []);

  const recordFire = useCallback((soldierIndex: number) => {
    lastFireTimeRef.current.set(soldierIndex, Date.now());
  }, []);

  const reset = useCallback(() => {
    lastFireTimeRef.current.clear();
  }, []);

  return { canFire, recordFire, reset };
}
