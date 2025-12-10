import { Server, Socket } from 'socket.io';
import { verifyToken } from './authMiddleware.js';
import { User, IUser } from '../models/Users.js';

export interface AuthenticatedSocket extends Socket {
  user?: IUser;
  userId?: string;
}

export function setupSocketAuth(io: Server) {
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        // Allow guest connections for now
        return next();
      }

      const decoded = verifyToken(token as string);

      if (!decoded) {
        return next(new Error('Invalid token'));
      }

      const user = await User.findById(decoded.userId);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });
}
