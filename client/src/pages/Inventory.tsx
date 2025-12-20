import { useState } from 'react';
import {
  CharacterIcon,
  CubeIcon,
  BrushIcon,
  StoreIcon,
  HistoryIcon,
  HeartIcon,
  ChartIcon,
  StarIcon
} from '@/components/icons';

type InventoryTab =
  | 'characters'
  | 'parts'
  | 'creator'
  | 'marketplace'
  | 'history'
  | 'wishlist'
  | 'analytics'
  | 'favorites';

interface TabConfig {
  id: InventoryTab;
  label: string;
  icon: JSX.Element;
  description: string;
}

const TABS: TabConfig[] = [
  {
    id: 'characters',
    label: 'My Characters',
    icon: <CharacterIcon size={20} />,
    description: 'All your owned characters and skins'
  },
  {
    id: 'parts',
    label: 'My Parts',
    icon: <CubeIcon size={20} />,
    description: 'Individual 3D parts and accessories'
  },
  {
    id: 'creator',
    label: 'Creator',
    icon: <BrushIcon size={20} />,
    description: 'Build custom characters from parts'
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    icon: <StoreIcon size={20} />,
    description: 'Buy and sell community assets'
  },
  {
    id: 'favorites',
    label: 'Favorites',
    icon: <StarIcon size={20} />,
    description: 'Your starred items'
  },
  {
    id: 'wishlist',
    label: 'Wishlist',
    icon: <HeartIcon size={20} />,
    description: 'Items you want to buy'
  },
  {
    id: 'history',
    label: 'History',
    icon: <HistoryIcon size={20} />,
    description: 'Purchase and sales history'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <ChartIcon size={20} />,
    description: 'Creator earnings and statistics'
  }
];

export default function Inventory() {
  const [activeTab, setActiveTab] = useState<InventoryTab>('characters');

  const activeTabConfig = TABS.find(tab => tab.id === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-purple-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Asset Inventory</h1>
              <p className="text-gray-300">
                {activeTabConfig?.description || 'Manage your assets and creations'}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-xs text-gray-300">Characters</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-xs text-gray-300">Parts</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-xs text-gray-300">Created</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-3">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium
                  transition-all duration-200 whitespace-nowrap
                  ${
                    activeTab === tab.id
                      ? 'bg-white text-purple-900 shadow-lg scale-105'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }
                `}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 min-h-[600px] p-6">
          {/* Tab Content */}
          {activeTab === 'characters' && <CharactersTab />}
          {activeTab === 'parts' && <PartsTab />}
          {activeTab === 'creator' && <CreatorTab />}
          {activeTab === 'marketplace' && <MarketplaceTab />}
          {activeTab === 'favorites' && <FavoritesTab />}
          {activeTab === 'wishlist' && <WishlistTab />}
          {activeTab === 'history' && <HistoryTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
        </div>
      </div>
    </div>
  );
}

// Tab Components (Placeholders for now)
function CharactersTab() {
  return (
    <div className="text-white">
      <h2 className="text-2xl font-bold mb-4">My Characters</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {/* Character cards will go here */}
        <EmptyState message="No characters yet. Visit the marketplace to get your first character!" />
      </div>
    </div>
  );
}

function PartsTab() {
  return (
    <div className="text-white">
      <h2 className="text-2xl font-bold mb-4">My Parts</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {/* Part cards will go here */}
        <EmptyState message="No parts yet. Create or buy parts to build custom characters!" />
      </div>
    </div>
  );
}

function CreatorTab() {
  return (
    <div className="text-white">
      <h2 className="text-2xl font-bold mb-4">Character Creator</h2>
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <BrushIcon size={64} className="mx-auto mb-4 opacity-50" />
          <p className="text-xl text-gray-300 mb-4">Advanced Character Creator</p>
          <p className="text-gray-400 mb-6">Coming Soon - Build custom 3D characters from parts!</p>
        </div>
      </div>
    </div>
  );
}

function MarketplaceTab() {
  return (
    <div className="text-white">
      <h2 className="text-2xl font-bold mb-4">Community Marketplace</h2>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select className="bg-white/10 text-white px-4 py-2 rounded-lg border border-white/20">
          <option>All Types</option>
          <option>Characters</option>
          <option>Parts</option>
        </select>
        <select className="bg-white/10 text-white px-4 py-2 rounded-lg border border-white/20">
          <option>All Rarities</option>
          <option>Common</option>
          <option>Rare</option>
          <option>Epic</option>
          <option>Legendary</option>
        </select>
        <input
          type="text"
          placeholder="Search assets..."
          className="bg-white/10 text-white px-4 py-2 rounded-lg border border-white/20 flex-1"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <EmptyState message="Marketplace coming soon! Trade assets with other players." />
      </div>
    </div>
  );
}

function FavoritesTab() {
  return (
    <div className="text-white">
      <h2 className="text-2xl font-bold mb-4">Favorite Assets</h2>
      <EmptyState message="No favorites yet. Star items to save them here!" />
    </div>
  );
}

function WishlistTab() {
  return (
    <div className="text-white">
      <h2 className="text-2xl font-bold mb-4">Wishlist</h2>
      <EmptyState message="Your wishlist is empty. Add items you want to buy later!" />
    </div>
  );
}

function HistoryTab() {
  return (
    <div className="text-white">
      <h2 className="text-2xl font-bold mb-4">Transaction History</h2>
      <div className="space-y-2">
        <EmptyState message="No transactions yet." />
      </div>
    </div>
  );
}

function AnalyticsTab() {
  return (
    <div className="text-white">
      <h2 className="text-2xl font-bold mb-4">Creator Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Sales" value="0" />
        <StatCard label="Total Earnings" value="0 coins" />
        <StatCard label="Creator Rating" value="N/A" />
      </div>
      <EmptyState message="Start creating and selling assets to see analytics!" />
    </div>
  );
}

// Helper Components
function EmptyState({ message }: { message: string }) {
  return (
    <div className="col-span-full flex items-center justify-center py-12">
      <p className="text-gray-400 text-center">{message}</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
}
