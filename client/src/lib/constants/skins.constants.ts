// Skins data
export const SKINS = {
  default: {
    id: 'default',
    name: 'Default',
    rarity: 'common' as const,
    price: { coins: 0 },
    colors: {
      primary: '#60a5fa',
      secondary: '#3b82f6'
    }
  },
  fire: {
    id: 'fire',
    name: 'Fire Runner',
    rarity: 'rare' as const,
    price: { coins: 5000 },
    colors: {
      primary: '#ef4444',
      secondary: '#dc2626'
    }
  },
  ice: {
    id: 'ice',
    name: 'Ice Runner',
    rarity: 'rare' as const,
    price: { coins: 5000 },
    colors: {
      primary: '#06b6d4',
      secondary: '#0891b2'
    }
  },
  golden: {
    id: 'golden',
    name: 'Golden Runner',
    rarity: 'epic' as const,
    price: { gems: 300 },
    colors: {
      primary: '#fbbf24',
      secondary: '#f59e0b'
    }
  },
  shadow: {
    id: 'shadow',
    name: 'Shadow Runner',
    rarity: 'epic' as const,
    price: { gems: 400 },
    colors: {
      primary: '#6b7280',
      secondary: '#4b5563'
    }
  },
  cosmic: {
    id: 'cosmic',
    name: 'Cosmic Runner',
    rarity: 'legendary' as const,
    price: { gems: 800 },
    colors: {
      primary: '#8b5cf6',
      secondary: '#7c3aed'
    }
  },
  rainbow: {
    id: 'rainbow',
    name: 'Rainbow Runner',
    rarity: 'legendary' as const,
    price: { gems: 1000 },
    colors: {
      primary: '#ec4899',
      secondary: '#8b5cf6'
    }
  }
} as const;
