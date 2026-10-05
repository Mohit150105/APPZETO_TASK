import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/User';
import { OrganizationMember } from '../models/OrganizationMember';
import { config } from '../config/env';
import { ConflictError, UnauthorizedError, NotFoundError } from '../utils/errors';

export class AuthService {
  private generateToken(user: IUser): string {
    return jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );
  }

  async register(data: { name: string; email: string; password: string }) {
    const existing = await User.findOne({ email: data.email.toLowerCase() }).lean();
    if (existing) {
      throw new ConflictError('A user with this email address already exists', 'EMAIL_ALREADY_EXISTS');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await User.create({
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      passwordHash,
    });

    const token = this.generateToken(user);

    return {
      user: user.toJSON(),
      token,
    };
  }

  async login(data: { email: string; password: string }) {
    const user = await User.findOne({ email: data.email.toLowerCase().trim() })
      .select('+passwordHash')
      .exec();

    if (!user) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const isMatch = await user.comparePassword(data.password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const token = this.generateToken(user);

    return {
      user: user.toJSON(),
      token,
    };
  }

  async getCurrentUser(userId: string) {
    const user = await User.findById(userId).lean();
    if (!user) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    // Retrieve all organizations the user is a member of
    const memberships = await OrganizationMember.find({ userId: user._id })
      .populate('organizationId', 'name createdBy createdAt')
      .lean();

    const organizations = memberships
      .filter((m) => m.organizationId)
      .map((m: any) => ({
        id: m.organizationId._id.toString(),
        name: m.organizationId.name,
        role: m.role,
        joinedAt: m.createdAt,
      }));

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      organizations,
    };
  }
}

export const authService = new AuthService();
