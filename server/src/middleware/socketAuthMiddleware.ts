import { Server, Socket } from 'socket.io';
import { verifyToken } from './authMiddleware.js';
import { User } from '../models/Users.js';
import { IUser } from '../../../shared/interface/IUser.js';

export interface AuthenticatedSocket extends Socket {
  user?: IUser;
  userId?: string;
}

export function setupSocketAuth(io: Server) {
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      console.log('[Socket Auth] New connection attempt');
      console.log('[Socket Auth] Token in auth:', socket.handshake.auth.token ? 'Present' : 'Missing');
      console.log('[Socket Auth] Token in query:', socket.handshake.query.token ? 'Present' : 'Missing');
      console.log('[Socket Auth] Final token:', token ? 'Present' : 'Missing');

      if (!token) {
        // Allow guest connections for now
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
  });
}
