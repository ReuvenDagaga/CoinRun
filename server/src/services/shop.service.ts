import { IUser } from "@shared/interface/IUser";
import { Transaction } from "../models/Transactions.js";
import { LOGGER } from "../log/logger.js";

export const SKINS = {
  default: { id: 'default', name: 'Default', rarity: 'common', price: { coins: 0 } },
  fire: { id: 'fire', name: 'Fire Runner', rarity: 'rare', price: { coins: 5000 } },
  ice: { id: 'ice', name: 'Ice Runner', rarity: 'rare', price: { coins: 5000 } },
  golden: { id: 'golden', name: 'Golden Runner', rarity: 'epic', price: { gems: 300 } },
  shadow: { id: 'shadow', name: 'Shadow Runner', rarity: 'epic', price: { gems: 400 } },
  cosmic: { id: 'cosmic', name: 'Cosmic Runner', rarity: 'legendary', price: { gems: 800 } },
  rainbow: { id: 'rainbow', name: 'Rainbow Runner', rarity: 'legendary', price: { gems: 1000 } }
};

const LOOTBOXES = {
  bronze: { price: 50, coinRange: [500, 2000], skinChance: 0.1, skinRarity: 'rare' },
  silver: { price: 150, coinRange: [2000, 5000], skinChance: 0.2, skinRarity: 'epic' },
  gold: { price: 300, coinRange: [5000, 15000], skinChance: 0.3, skinRarity: 'legendary' }
};

export const getAllSkins = (user: IUser | undefined) => {
  return Object.values(SKINS).map(skin => ({
    ...skin,
    owned: user ? user.ownedSkins.includes(skin.id) : skin.id === 'default',
    equipped: user ? user.currentSkin === skin.id : false
  }));
};

export const purchaseSkin = async (user: IUser, skinId: string) => {
  const skin = SKINS[skinId as keyof typeof SKINS];

  if (!skin) throw new Error('Invalid skin');
  if (user.ownedSkins.includes(skinId)) throw new Error('Skin already owned');

  if ('gems' in skin.price && skin.price.gems) {
    if (user.gems < skin.price.gems) throw new Error('Insufficient gems');

    const prevGems = user.gems;
    user.gems -= skin.price.gems;

    await Transaction.create({
      userId: user._id,
      type: 'shop_purchase',
      currency: 'gems',
      amount: -skin.price.gems,
      balanceBefore: prevGems,
      balanceAfter: user.gems,
      description: `Purchased skin: ${skin.name}`,
      relatedItemId: skinId
    });
  } else if ('coins' in skin.price && skin.price.coins) {
    if (user.coins < skin.price.coins) throw new Error('Insufficient coins');

    const prevCoins = user.coins;
    user.coins -= skin.price.coins;

    await Transaction.create({
      userId: user._id,
      type: 'shop_purchase',
      currency: 'coins',
      amount: -skin.price.coins,
      balanceBefore: prevCoins,
      balanceAfter: user.coins,
      description: `Purchased skin: ${skin.name}`,
      relatedItemId: skinId
    });
  }

  user.ownedSkins.push(skinId);
  await user.save();

  LOGGER.info(`User ${user._id} purchased skin: ${skin.name}`);

  return {
    skin: { ...skin, owned: true },
    balance: { coins: user.coins, gems: user.gems }
  };
};

export const equipSkinService = async (user: IUser, skinId: string) => {
  if (!user.ownedSkins.includes(skinId)) throw new Error('Skin not owned');

  user.currentSkin = skinId;
  await user.save();

  LOGGER.info(`User ${user._id} equipped skin: ${skinId}`);

  return { currentSkin: skinId };
};

export const openLootbox = async (user: IUser, type: string) => {
  const lootbox = LOOTBOXES[type as keyof typeof LOOTBOXES];

  if (!lootbox) throw new Error('Invalid lootbox type');
  if (user.gems < lootbox.price) throw new Error('Insufficient gems');

  const prevGems = user.gems;
  user.gems -= lootbox.price;

  let reward: { type: 'coins' | 'skin'; value: number | string };

  if (Math.random() < lootbox.skinChance) {
    const skinsByRarity = Object.values(SKINS).filter(
      s => s.rarity === lootbox.skinRarity && !user.ownedSkins.includes(s.id)
    );

    if (skinsByRarity.length > 0) {
      const wonSkin = skinsByRarity[Math.floor(Math.random() * skinsByRarity.length)];
      user.ownedSkins.push(wonSkin.id);
      reward = { type: 'skin', value: wonSkin.id };
      LOGGER.info(`User ${user._id} won skin from lootbox: ${wonSkin.name}`);
    } else {
      const coinAmount = Math.floor(
        Math.random() * (lootbox.coinRange[1] - lootbox.coinRange[0]) + lootbox.coinRange[0]
      );
      user.coins += coinAmount;
      reward = { type: 'coins', value: coinAmount };
    }
  } else {
    const coinAmount = Math.floor(
      Math.random() * (lootbox.coinRange[1] - lootbox.coinRange[0]) + lootbox.coinRange[0]
    );
    user.coins += coinAmount;
    reward = { type: 'coins', value: coinAmount };
  }

  await user.save();

  await Transaction.create({
    userId: user._id,
    type: 'shop_purchase',
    currency: 'gems',
    amount: -lootbox.price,
    balanceBefore: prevGems,
    balanceAfter: user.gems,
    description: `Opened ${type} lootbox`,
    relatedItemId: `lootbox_${type}`
  });

  LOGGER.info(`User ${user._id} opened ${type} lootbox`);

  return {
    reward,
    balance: { coins: user.coins, gems: user.gems }
  };
};
