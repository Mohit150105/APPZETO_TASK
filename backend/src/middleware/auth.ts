import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AuthenticatedRequest, IUserPayload } from '../types';
import { UnauthorizedError } from '../utils/errors';
import { User } from '../models/User';

export const requireAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authorization token is missing or malformed', 'AUTH_TOKEN_MISSING');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('Token not found', 'AUTH_TOKEN_MISSING');
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Authentication token has expired', 'TOKEN_EXPIRED');
      }
      throw new UnauthorizedError('Invalid authentication token', 'TOKEN_INVALID');
    }

    // Verify user still exists in database
    const user = await User.findById(decoded.id).lean();
    if (!user) {
      throw new UnauthorizedError('User account no longer exists', 'USER_NOT_FOUND');
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    };

    next();
  } catch (error) {
    next(error);
  }
};
