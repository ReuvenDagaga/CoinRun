import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import UpgradeCard from './UpgradeCard';
import { upgrades } from './upgrades';

export default function UpgradesGrid() {
  const { user, purchaseUpgrade, getUpgradeCost, canAffordUpgrade } = useAuth();
  const [loadingUpgrade, setLoadingUpgrade] = useState<string | null>(null);

  if (!user) return null;

  const handleUpgrade = async (type: string) => {
    setLoadingUpgrade(type);
    await purchaseUpgrade(type as any);
    setLoadingUpgrade(null);
  };

  return (
    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
      {upgrades.map((upgrade) => {
        const level = user.upgrades[upgrade.key as keyof typeof user.upgrades] || 0;
        const cost = getUpgradeCost(upgrade.key as any);
        const canAfford = canAffordUpgrade(upgrade.key as any);

        return (
          <UpgradeCard
            key={upgrade.key}
            upgrade={upgrade}
            level={level}
            cost={cost}
            canAfford={canAfford}
            isLoading={loadingUpgrade === upgrade.key}
            onUpgrade={() => handleUpgrade(upgrade.key)}
          />
        );
      })}
    </div>
  );
}
