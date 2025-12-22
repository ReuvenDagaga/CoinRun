import { CardType, CardRarity } from "@shared/interface/ICard";

export const CARD_TYPE_IMAGES: Record<CardType, string> = {
  speed: '/ui/cards/rate.png',
  jump: '/ui/cards/common.png',
  income: '/ui/cards/legendery.png',
  power: '/ui/cards/red.png',
  magnet: '/ui/cards/epic.png',
};

// Card images by type and rarity
// Path format: /ui/cards/{type}/{rarity}.png
export const getCardImage = (type: CardType, rarity: CardRarity): string => {
  return `/ui/cards/${type}/${rarity}.png`;
};