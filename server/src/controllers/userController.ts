import { Request, Response } from 'express';
import { User } from '../models/Users.js';

/**
 * Update user data
 * PUT /api/user/update
 * Protected route - requires authentication
 */
export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const updates = req.body;

    // Prevent updating sensitive fields
    const blockedFields = ['_id', 'googleId', 'email', 'createdAt', 'updatedAt', 'referralCode'];
    blockedFields.forEach(field => delete updates[field]);

    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedUser
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
