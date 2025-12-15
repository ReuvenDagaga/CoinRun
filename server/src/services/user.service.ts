import { User } from '../models/Users.js';
import { LOGGER } from '../log/logger.js';

const BLOCKED_FIELDS = ['_id', 'googleId', 'email', 'createdAt', 'updatedAt', 'referralCode'];

export const updateUserData = async (userId: string, updates: any) => {
  BLOCKED_FIELDS.forEach(field => delete updates[field]);

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!updatedUser) throw new Error('User not found');

  LOGGER.info(`User ${userId} updated profile`);

  return updatedUser;
};
