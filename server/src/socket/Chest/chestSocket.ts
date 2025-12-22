import { Server } from 'socket.io';
import { AuthenticatedSocket, setupNamespaceAuth } from '../../middleware/socketAuthMiddleware.js';
import { User } from '../../models/Users.js';
import { getChestStatus, generateNextTimedChest } from '../../services/chest.service.js';
import { LOGGER } from '../../log/logger.js';

const TIMER_CHECK_INTERVAL = 10000; // Check every 10 seconds
const connectedUsers = new Map<string, ReturnType<typeof setInterval>>();

/**
 * Socket.io namespace for chest timer system
 *
 * Handles real-time chest availability notifications
 * Only active while user is connected (no offline accumulation)
 */
export function setupChestSocket(io: Server) {
  const chestNamespace = io.of('/chests');

  // Apply authentication middleware to this namespace
  setupNamespaceAuth(chestNamespace);

  chestNamespace.on('connection', async (socket: AuthenticatedSocket) => {
    const userId = socket.userId;
    if (!userId) {
      LOGGER.warn('Chest socket connection without userId, disconnecting');
      socket.disconnect();
      return;
    }

    LOGGER.info(`User ${userId} connected to chest timer`);

    // Send initial chest status
    try {
      const user = await User.findById(userId);
      if (user) {
        // Initialize chest if needed
        if (!user.timedChest || user.timedChest.claimed) {
          generateNextTimedChest(user);
          await user.save();
        }
        const status = getChestStatus(user);
        socket.emit('chest:status', status);
      }
    } catch (err: any) {
      LOGGER.error('Error fetching initial chest status: ' + (err?.message || err));
    }

    // Set up periodic updates
    const intervalId = setInterval(async () => {
      try {
        const user = await User.findById(userId);
        if (user) {
          const status = getChestStatus(user);
          socket.emit('chest:status', status);

          // Notify when chest becomes ready
          if (status.isReady) {
            socket.emit('chest:ready', { tier: status.tier });
          }
        }
      } catch (err: any) {
        LOGGER.error('Error in chest timer interval: ' + (err?.message || err));
      }
    }, TIMER_CHECK_INTERVAL);

    connectedUsers.set(userId, intervalId);

    // Handle manual status request
    socket.on('chest:getStatus', async () => {
      try {
        const user = await User.findById(userId);
        if (user) {
          const status = getChestStatus(user);
          socket.emit('chest:status', status);
        }
      } catch (err: any) {
        LOGGER.error('Error getting chest status: ' + (err?.message || err));
      }
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      LOGGER.info(`User ${userId} disconnected from chest timer`);
      const interval = connectedUsers.get(userId);
      if (interval) {
        clearInterval(interval);
        connectedUsers.delete(userId);
      }
    });
  });

  LOGGER.info('Chest socket namespace initialized');
}

/**
 * Get count of users currently connected to chest timer
 */
export function getConnectedChestUsersCount(): number {
  return connectedUsers.size;
}
