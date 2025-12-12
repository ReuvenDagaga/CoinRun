import { User, IUser } from '../models/Users.js';
import { generateToken } from '../middleware/authMiddleware.js';
import { LOGGER } from '../log/logger.js';
import type { BasicUserResponse, FullUserResponse } from '@shared/types/user.types.js';

interface GoogleAuthData {
    googleId: string;
    email: string;
    username?: string;
    avatar?: string;
}

interface AuthResult {
    token: string;
    user: IUser;
    isNewUser: boolean;
}

export const authenticateWithGoogle = async (data: GoogleAuthData): Promise<AuthResult> => {
    const { googleId, email, username, avatar } = data;

    let user = await User.findOne({ googleId });
    let isNewUser = false;

    if (user) await updateAvatar(user, avatar);

    if (!user) user = await createUser(googleId, email, username, avatar), isNewUser = true;

    if (!user) throw LOGGER.error('User creation failed during Google authentication');
    
    const token = generateToken(user._id.toString());

    return { token, user, isNewUser };
}

export const createUser = async (
    googleId: string,
    email: string,
    username: string | undefined,
    avatar: string | undefined
): Promise<typeof User.prototype> => {
    const user = new User({
        googleId,
        email: email.toLowerCase(),
        username: username || `user_${googleId.substring(0, 8)}`,
        avatar
    });
    await user.save();    
    LOGGER.info(`New user registered: ${user.email}`);
    return user;
}

export const updateAvatar = async (user: IUser, avatar: string | undefined): Promise<void> => {
    if (avatar && user.avatar !== avatar) {
        user.avatar = avatar;
        await user.save();
        LOGGER.info(`Updated avatar for user: ${user.email}`);
    }
}

/**
 * Format user data for basic API responses
 * Returns only essential user information
 *
 * @param user - MongoDB user document
 * @returns BasicUserResponse matching shared type definition
 */
export function formatUserResponse(user: IUser): BasicUserResponse {
    return {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        coins: user.coins,
        gems: user.gems
    };
}

/**
 * Format user data for full API responses (auth, profile, etc.)
 * Returns complete user data needed by the frontend
 *
 * IMPORTANT: This response shape is the SINGLE SOURCE OF TRUTH
 * All frontend code must expect this exact structure
 *
 * @param user - MongoDB user document
 * @returns FullUserResponse matching shared type definition
 */
export function formatFullUserResponse(user: IUser): FullUserResponse {
    return {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        coins: user.coins,
        gems: user.gems,
        upgrades: user.upgrades,
        stats: {
            gamesPlayed: user.gamesPlayed,
            gamesWon: user.gamesWon,
            totalDistance: user.totalDistance,
            totalCoinsCollected: user.totalCoinsCollected,
            highestArmy: user.highestArmy,
            bestScore: user.bestScore
        },
        currentSkin: user.currentSkin,
        ownedSkins: user.ownedSkins,
        settings: user.settings,
        dailyMissions: user.dailyMissions,
        weeklyMissions: user.weeklyMissions,
        achievements: user.achievements,
        activeBoosts: user.activeBoosts
    };
}