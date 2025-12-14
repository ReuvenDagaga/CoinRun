export interface ShopItem {
  id: string;
  image: string;
  description: string;
  price: string;
  tag?: string;
  tagColor?: string;
}

export const giftItems: ShopItem[] = [
  { id: 'gift1', image: '/ui/shop/100CoinsAd.Png', description: '100 Coins', price: 'Watch Ad' },
  { id: 'gift2', image: '/ui/shop/500Coins20GemsAd.Png', description: '500 Coins + 20 Gems', price: 'Watch Ad' },
];

export const comboItems: ShopItem[] = [
  { id: 'combo1', image: '/ui/shop/10000Coins50Gems.Png', description: '10K + 50 Gems', price: '$1.99' },
  { id: 'combo2', image: '/ui/shop/50000Coins300Gems.Png', description: '50K + 300 Gems', price: '$7.99', tag: '-20%', tagColor: 'bg-red-500' },
  { id: 'combo3', image: '/ui/shop/200KCoins1000Gems.Png', description: '200K + 1K Gems', price: '$19.99', tag: '-35%', tagColor: 'bg-red-500' },
];

export const crateItems: ShopItem[] = [
  { id: 'crate1', image: '/ui/shop/CreateA.Png', description: '1 Crate', price: '$0.99' },
  { id: 'crate2', image: '/ui/shop/CreateB.Png', description: '3 Crates +10%', price: '$2.49', tag: 'BEST', tagColor: 'bg-yellow-500' },
  { id: 'crate3', image: '/ui/shop/CreateC.Png', description: '10 Crates +25%', price: '$6.99' },
];

export const gemItems: ShopItem[] = [
  { id: 'gem1', image: '/ui/shop/gems-small.png', description: '50 Gems', price: '$0.99' },
  { id: 'gem2', image: '/ui/shop/gems-medium.png', description: '150 Gems +10%', price: '$2.49', tag: 'POPULAR', tagColor: 'bg-purple-500' },
  { id: 'gem3', image: '/ui/shop/gems-large.png', description: '500 Gems +25%', price: '$6.99' },
];

export const coinItems: ShopItem[] = [
  { id: 'coin1', image: '/ui/shop/CoinsA.Png', description: '5,000 Coins', price: '$0.99' },
  { id: 'coin2', image: '/ui/shop/CoinsB.Png', description: '15,000 +15%', price: '$2.49', tag: 'VALUE', tagColor: 'bg-yellow-500' },
  { id: 'coin3', image: '/ui/shop/CoinsC.Png', description: '50,000 +30%', price: '$6.99' },
];
