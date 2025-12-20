import { CustomCharacter, ICustomCharacter, ICharacterParts } from '../models/CustomCharacter';
import { UserAsset } from '../models/UserAsset';
import { User } from '../models/Users';
import mongoose from 'mongoose';

export class CustomCharacterService {
  /**
   * Create a new custom character
   */
  static async createCharacter(
    userId: string,
    characterData: {
      name: string;
      parts: ICharacterParts;
      overallScale?: number;
      overallColors?: any;
      description?: string;
      tags?: string[];
      isPublic?: boolean;
    }
  ) {
    // Verify user owns all the parts
    const partIds = Object.values(characterData.parts)
      .flat()
      .filter(Boolean) as string[];

    if (partIds.length === 0) {
      throw new Error('Character must have at least one part');
    }

    const ownedAssets = await UserAsset.find({
      userId: new mongoose.Types.ObjectId(userId),
      assetId: { $in: partIds.map(id => new mongoose.Types.ObjectId(id)) }
    });

    if (ownedAssets.length !== partIds.length) {
      throw new Error('You do not own all the parts used in this character');
    }

    // Create character
    const character = new CustomCharacter({
      userId: new mongoose.Types.ObjectId(userId),
      ...characterData,
      isEquipped: false,
      isPublic: characterData.isPublic || false
    });

    await character.save();

    return character;
  }

  /**
   * Update a custom character
   */
  static async updateCharacter(
    characterId: string,
    userId: string,
    updates: Partial<ICustomCharacter>
  ) {
    const character = await CustomCharacter.findById(characterId);

    if (!character) {
      throw new Error('Character not found');
    }

    if (character.userId.toString() !== userId) {
      throw new Error('Not authorized to update this character');
    }

    // If updating parts, verify ownership
    if (updates.parts) {
      const partIds = Object.values(updates.parts)
        .flat()
        .filter(Boolean) as string[];

      const ownedAssets = await UserAsset.find({
        userId: new mongoose.Types.ObjectId(userId),
        assetId: { $in: partIds.map(id => new mongoose.Types.ObjectId(id)) }
      });

      if (ownedAssets.length !== partIds.length) {
        throw new Error('You do not own all the parts used in this character');
      }
    }

    Object.assign(character, updates);
    await character.save();

    return character;
  }

  /**
   * Delete a custom character
   */
  static async deleteCharacter(characterId: string, userId: string) {
    const character = await CustomCharacter.findById(characterId);

    if (!character) {
      throw new Error('Character not found');
    }

    if (character.userId.toString() !== userId) {
      throw new Error('Not authorized to delete this character');
    }

    if (character.isEquipped) {
      // Unequip first - set user back to preset character
      const user = await User.findById(userId);
      if (user) {
        user.currentCharacterType = 'preset';
        user.currentCustomCharacterId = undefined;
        await user.save();
      }
    }

    await character.deleteOne();

    return { success: true };
  }

  /**
   * Equip a custom character
   */
  static async equipCharacter(characterId: string, userId: string) {
    const character = await CustomCharacter.findById(characterId);

    if (!character) {
      throw new Error('Character not found');
    }

    if (character.userId.toString() !== userId) {
      throw new Error('Not authorized to equip this character');
    }

    // Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Unequip all other custom characters for this user
      await CustomCharacter.updateMany(
        {
          userId: new mongoose.Types.ObjectId(userId),
          isEquipped: true
        },
        { isEquipped: false },
        { session }
      );

      // Equip this character
      character.isEquipped = true;
      await character.save({ session });

      // Update user's current character
      const user = await User.findById(userId);
      if (user) {
        user.currentCharacterType = 'custom';
        user.currentCustomCharacterId = character._id.toString();
        await user.save({ session });
      }

      await session.commitTransaction();
      session.endSession();

      return character;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Unequip custom character (revert to preset)
   */
  static async unequipCharacter(userId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Unequip all custom characters
      await CustomCharacter.updateMany(
        {
          userId: new mongoose.Types.ObjectId(userId),
          isEquipped: true
        },
        { isEquipped: false },
        { session }
      );

      // Update user
      const user = await User.findById(userId);
      if (user) {
        user.currentCharacterType = 'preset';
        user.currentCustomCharacterId = undefined;
        await user.save({ session });
      }

      await session.commitTransaction();
      session.endSession();

      return { success: true };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Get user's custom characters
   */
  static async getUserCharacters(userId: string) {
    const characters = await CustomCharacter.find({
      userId: new mongoose.Types.ObjectId(userId)
    })
      .populate('parts.head')
      .populate('parts.torso')
      .populate('parts.leftArm')
      .populate('parts.rightArm')
      .populate('parts.leftLeg')
      .populate('parts.rightLeg')
      .populate('parts.hair')
      .populate('parts.face')
      .populate('parts.accessories')
      .sort({ createdAt: -1 });

    return characters;
  }

  /**
   * Get a single character with full details
   */
  static async getCharacter(characterId: string) {
    const character = await CustomCharacter.findById(characterId)
      .populate('parts.head')
      .populate('parts.torso')
      .populate('parts.leftArm')
      .populate('parts.rightArm')
      .populate('parts.leftLeg')
      .populate('parts.rightLeg')
      .populate('parts.hair')
      .populate('parts.face')
      .populate('parts.accessories')
      .populate('userId', 'username avatar');

    if (!character) {
      throw new Error('Character not found');
    }

    return character;
  }

  /**
   * Get public character gallery
   */
  static async getPublicGallery(filters?: {
    sortBy?: 'newest' | 'popular' | 'liked';
    search?: string;
    limit?: number;
  }) {
    const query: any = { isPublic: true };

    if (filters?.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { tags: { $regex: filters.search, $options: 'i' } }
      ];
    }

    let sortOrder: any = { createdAt: -1 };
    if (filters?.sortBy === 'popular') {
      sortOrder = { views: -1 };
    } else if (filters?.sortBy === 'liked') {
      sortOrder = { likes: -1 };
    }

    const characters = await CustomCharacter.find(query)
      .populate('userId', 'username avatar')
      .sort(sortOrder)
      .limit(filters?.limit || 50);

    return characters;
  }

  /**
   * Increment character views
   */
  static async incrementViews(characterId: string) {
    await CustomCharacter.findByIdAndUpdate(characterId, { $inc: { views: 1 } });
  }

  /**
   * Like a character
   */
  static async likeCharacter(characterId: string) {
    await CustomCharacter.findByIdAndUpdate(characterId, { $inc: { likes: 1 } });
  }

  /**
   * Unlike a character
   */
  static async unlikeCharacter(characterId: string) {
    const character = await CustomCharacter.findById(characterId);
    if (character && character.likes > 0) {
      character.likes -= 1;
      await character.save();
    }
  }

  /**
   * Validate character parts compatibility
   */
  static async validateCharacterParts(parts: ICharacterParts): Promise<boolean> {
    // This could be extended to check if parts are compatible with each other
    // For now, just verify they exist
    const partIds = Object.values(parts)
      .flat()
      .filter(Boolean) as string[];

    if (partIds.length === 0) {
      return false;
    }

    // Could add more validation logic here
    return true;
  }
}

export default CustomCharacterService;
