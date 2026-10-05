import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { User } from '../models/User';
import { IUserPayload } from '../types';

export const socketAuthMiddleware = async (
  socket: Socket,
  next: (err?: Error) => void
): Promise<void> => {
  try {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers.authorization &&
        socket.handshake.headers.authorization.split(' ')[1]) ||
      socket.handshake.query?.token;

    if (!token || typeof token !== 'string') {
      return next(new Error('Authentication error: Token missing'));
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (err: any) {
      return next(new Error('Authentication error: Invalid or expired token'));
    }

    const user = await User.findById(decoded.id).lean();
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    socket.data.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    } as IUserPayload;

    next();
  } catch (err) {
    next(new Error('Authentication error: Server validation error'));
  }
};
