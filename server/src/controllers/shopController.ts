import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { User } from '../models/Users.js';
import { Transaction } from '../models/Transactions.js';

// Skins data
const SKINS = {
  default: { id: 'default', name: 'Default', rarity: 'common', price: { coins: 0 } },
  fire: { id: 'fire', name: 'Fire Runner', rarity: 'rare', price: { coins: 5000 } },
  ice: { id: 'ice', name: 'Ice Runner', rarity: 'rare', price: { coins: 5000 } },
  golden: { id: 'golden', name: 'Golden Runner', rarity: 'epic', price: { gems: 300 } },
  shadow: { id: 'shadow', name: 'Shadow Runner', rarity: 'epic', price: { gems: 400 } },
  cosmic: { id: 'cosmic', name: 'Cosmic Runner', rarity: 'legendary', price: { gems: 800 } },
  rainbow: { id: 'rainbow', name: 'Rainbow Runner', rarity: 'legendary', price: { gems: 1000 } }
};

// Get all skins
export async function getSkins(req: AuthRequest, res: Response) {
  try {
    const user = req.user;

    const skinsData = Object.values(SKINS).map(skin => ({
      ...skin,
      owned: user ? user.ownedSkins.includes(skin.id) : skin.id === 'default',
      equipped: user ? user.currentSkin === skin.id : false
    }));

    res.json({
      success: true,
      data: skinsData
    });
  } catch (error) {
    console.error('Get skins error:', error);
    res.status(500).json({ success: false, error: 'Failed to get skins' });
  }
}

// Buy skin
export async function buySkin(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { skinId } = req.body;
    const skin = SKINS[skinId as keyof typeof SKINS];

    if (!skin) {
      return res.status(400).json({ success: false, error: 'Invalid skin' });
    }

    if (user.ownedSkins.includes(skinId)) {
      return res.status(400).json({ success: false, error: 'Skin already owned' });
    }

    // Check currency and deduct
    if (skin.price.gems) {
      if (user.gems < skin.price.gems) {
        return res.status(400).json({ success: false, error: 'Insufficient gems' });
      }
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
    } else if (skin.price.coins) {
      if (user.coins < skin.price.coins) {
        return res.status(400).json({ success: false, error: 'Insufficient coins' });
      }
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

    // Add skin to owned
    user.ownedSkins.push(skinId);
    await user.save();

    res.json({
      success: true,
      data: {
        skin: { ...skin, owned: true },
        balance: { coins: user.coins, gems: user.gems }
      }
    });
  } catch (error) {
    console.error('Buy skin error:', error);
    res.status(500).json({ success: false, error: 'Failed to buy skin' });
  }
}

// Equip skin
export async function equipSkin(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { skinId } = req.body;

    if (!user.ownedSkins.includes(skinId)) {
      return res.status(400).json({ success: false, error: 'Skin not owned' });
    }

    user.currentSkin = skinId;
    await user.save();

    res.json({
      success: true,
      data: { currentSkin: skinId }
    });
  } catch (error) {
    console.error('Equip skin error:', error);
    res.status(500).json({ success: false, error: 'Failed to equip skin' });
  }
}

// Buy lootbox
export async function buyLootbox(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { type } = req.body;

    const lootboxes = {
      bronze: { price: 50, coinRange: [500, 2000], skinChance: 0.1, skinRarity: 'rare' },
      silver: { price: 150, coinRange: [2000, 5000], skinChance: 0.2, skinRarity: 'epic' },
      gold: { price: 300, coinRange: [5000, 15000], skinChance: 0.3, skinRarity: 'legendary' }
    };

    const lootbox = lootboxes[type as keyof typeof lootboxes];
    if (!lootbox) {
      return res.status(400).json({ success: false, error: 'Invalid lootbox type' });
    }

    if (user.gems < lootbox.price) {
      return res.status(400).json({ success: false, error: 'Insufficient gems' });
    }

    // Deduct gems
    const prevGems = user.gems;
    user.gems -= lootbox.price;

    // Generate reward
    let reward: { type: 'coins' | 'skin'; value: number | string };

    if (Math.random() < lootbox.skinChance) {
      // Win a skin
      const skinsByRarity = Object.values(SKINS).filter(
        s => s.rarity === lootbox.skinRarity && !user.ownedSkins.includes(s.id)
      );

      if (skinsByRarity.length > 0) {
        const wonSkin = skinsByRarity[Math.floor(Math.random() * skinsByRarity.length)];
        user.ownedSkins.push(wonSkin.id);
        reward = { type: 'skin', value: wonSkin.id };
      } else {
        // No skins available, give coins instead
        const coinAmount = Math.floor(
          Math.random() * (lootbox.coinRange[1] - lootbox.coinRange[0]) + lootbox.coinRange[0]
        );
        user.coins += coinAmount;
        reward = { type: 'coins', value: coinAmount };
      }
    } else {
      // Win coins
      const coinAmount = Math.floor(
        Math.random() * (lootbox.coinRange[1] - lootbox.coinRange[0]) + lootbox.coinRange[0]
      );
      user.coins += coinAmount;
      reward = { type: 'coins', value: coinAmount };
    }

    await user.save();

    // Create transaction
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

    res.json({
      success: true,
      data: {
        reward,
        balance: { coins: user.coins, gems: user.gems }
      }
    });
  } catch (error) {
    console.error('Buy lootbox error:', error);
    res.status(500).json({ success: false, error: 'Failed to open lootbox' });
  }
}

// ❌ REMOVED: buyGems with USDT (crypto removed)
// Gems can be earned through missions/achievements
// Future: Add IAP (In-App Purchase) integration for real money gem purchases
