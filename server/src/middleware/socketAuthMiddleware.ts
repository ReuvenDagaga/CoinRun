import { Server, Socket, Namespace } from 'socket.io';
import { verifyToken } from './authMiddleware.js';
import { User } from '../models/Users.js';
import { IUser } from '../../../shared/interface/IUser.js';

export interface AuthenticatedSocket extends Socket {
  user?: IUser;
  userId?: string;
}

/**
 * Socket authentication middleware function
 * Can be applied to main io instance or specific namespaces
 */
export async function socketAuthMiddleware(socket: AuthenticatedSocket, next: (err?: Error) => void) {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    console.log('[Socket Auth] New connection attempt');
    console.log('[Socket Auth] Namespace:', socket.nsp.name);
    console.log('[Socket Auth] Token in auth:', socket.handshake.auth.token ? 'Present' : 'Missing');
    console.log('[Socket Auth] Token in query:', socket.handshake.query.token ? 'Present' : 'Missing');
    console.log('[Socket Auth] Final token:', token ? 'Present' : 'Missing');

    if (!token) {
      // For PvP namespace, require authentication
      if (socket.nsp.name === '/pvp') {
        console.log('[Socket Auth] ❌ PvP requires authentication - rejecting guest');
        return next(new Error('Authentication required for PvP'));
      }
      // Allow guest connections for other namespaces
      console.log('[Socket Auth] ⚠️ No token provided - allowing as guest');
      return next();
    }

    console.log('[Socket Auth] Verifying token...');
    const decoded = verifyToken(token as string);

    if (!decoded) {
      console.log('[Socket Auth] ❌ Token verification failed');
      return next(new Error('Invalid token'));
    }

    console.log('[Socket Auth] Token verified, user ID:', decoded.userId);
    const user = await User.findById(decoded.userId);

    if (!user) {
      console.log('[Socket Auth] ❌ User not found:', decoded.userId);
      return next(new Error('User not found'));
    }

    socket.user = user;
    socket.userId = decoded.userId;
    console.log('[Socket Auth] ✅ Authentication successful:', user.username);
    next();
  } catch (error) {
    console.log('[Socket Auth] ❌ Error:', error);
    next(new Error('Authentication error'));
  }
}

/**
 * Setup authentication middleware for main io instance
 */
export function setupSocketAuth(io: Server) {
  io.use(socketAuthMiddleware);
}

/**
 * Setup authentication middleware for a specific namespace
 */
export function setupNamespaceAuth(namespace: Namespace) {
  namespace.use(socketAuthMiddleware);
}
