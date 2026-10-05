import mongoose from 'mongoose';
import { Organization } from '../models/Organization';
import { OrganizationMember } from '../models/OrganizationMember';
import { User } from '../models/User';
import { auditService } from './audit.service';
import { notificationService } from './notification.service';
import { NotFoundError, ConflictError, ForbiddenError, ValidationError } from '../utils/errors';
import { UserRole } from '../types';

export class OrganizationService {
  async createOrganization(name: string, userId: string) {
    const org = await Organization.create({
      name: name.trim(),
      createdBy: new mongoose.Types.ObjectId(userId),
    });

    // Creator automatically becomes OWNER
    await OrganizationMember.create({
      organizationId: org._id,
      userId: new mongoose.Types.ObjectId(userId),
      role: 'OWNER',
    });

    await auditService.log({
      userId,
      organizationId: org._id.toString(),
      action: 'ORG_CREATED',
      entity: 'Organization',
      entityId: org._id.toString(),
      newValue: { name: org.name },
    });

    return {
      ...org.toJSON(),
      role: 'OWNER',
    };
  }

  async getUserOrganizations(userId: string) {
    const memberships = await OrganizationMember.find({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .populate('organizationId')
      .lean();

    return memberships
      .filter((m) => m.organizationId)
      .map((m: any) => ({
        id: m.organizationId._id.toString(),
        name: m.organizationId.name,
        role: m.role,
        createdBy: m.organizationId.createdBy.toString(),
        createdAt: m.organizationId.createdAt,
      }));
  }

  async getOrganizationById(organizationId: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw new NotFoundError('Invalid organization ID', 'INVALID_ORG_ID');
    }

    const org = await Organization.findById(organizationId).lean();
    if (!org) {
      throw new NotFoundError('Organization not found', 'ORG_NOT_FOUND');
    }

    const membership = await OrganizationMember.findOne({
      organizationId: org._id,
      userId: new mongoose.Types.ObjectId(userId),
    }).lean();

    if (!membership) {
      throw new ForbiddenError('You are not a member of this organization', 'FORBIDDEN_ORG_ACCESS');
    }

    const memberCount = await OrganizationMember.countDocuments({ organizationId: org._id });

    return {
      id: org._id.toString(),
      name: org.name,
      createdBy: org.createdBy.toString(),
      createdAt: org.createdAt,
      currentUserRole: membership.role,
      memberCount,
    };
  }

  async getMembers(organizationId: string) {
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw new NotFoundError('Invalid organization ID', 'INVALID_ORG_ID');
    }

    const members = await OrganizationMember.find({
      organizationId: new mongoose.Types.ObjectId(organizationId),
    })
      .populate('userId', 'name email avatarUrl')
      .sort({ createdAt: 1 })
      .lean();

    return members.map((m: any) => ({
      id: m._id.toString(),
      organizationId: m.organizationId.toString(),
      role: m.role,
      user: m.userId
        ? {
            id: m.userId._id.toString(),
            name: m.userId.name,
            email: m.userId.email,
            avatarUrl: m.userId.avatarUrl,
          }
        : null,
      joinedAt: m.createdAt,
    }));
  }

  async addMember(params: {
    organizationId: string;
    targetUserId?: string;
    email?: string;
    role: UserRole;
    actorUserId: string;
  }) {
    let targetUser;
    if (params.targetUserId) {
      targetUser = await User.findById(params.targetUserId).lean();
    } else if (params.email) {
      targetUser = await User.findOne({ email: params.email.toLowerCase().trim() }).lean();
    }

    if (!targetUser) {
      throw new NotFoundError('User to invite was not found', 'TARGET_USER_NOT_FOUND');
    }

    const org = await Organization.findById(params.organizationId).lean();
    if (!org) {
      throw new NotFoundError('Organization not found', 'ORG_NOT_FOUND');
    }

    const existingMember = await OrganizationMember.findOne({
      organizationId: org._id,
      userId: targetUser._id,
    });

    if (existingMember) {
      throw new ConflictError('User is already a member of this organization', 'MEMBER_ALREADY_EXISTS');
    }

    const newMembership = await OrganizationMember.create({
      organizationId: org._id,
      userId: targetUser._id,
      role: params.role || 'MEMBER',
    });

    // Record audit log
    await auditService.log({
      userId: params.actorUserId,
      organizationId: params.organizationId,
      action: 'MEMBER_ADDED',
      entity: 'OrganizationMember',
      entityId: newMembership._id.toString(),
      newValue: {
        userId: targetUser._id.toString(),
        email: targetUser.email,
        role: newMembership.role,
      },
    });

    // Send notification to invited user
    await notificationService.notify({
      recipientId: targetUser._id.toString(),
      organizationId: params.organizationId,
      type: 'ORG_INVITE',
      message: `You were added to organization "${org.name}" as ${newMembership.role}`,
      relatedEntity: {
        entityType: 'Organization',
        entityId: params.organizationId,
      },
    });

    return {
      id: newMembership._id.toString(),
      organizationId: org._id.toString(),
      role: newMembership.role,
      user: {
        id: targetUser._id.toString(),
        name: targetUser.name,
        email: targetUser.email,
        avatarUrl: targetUser.avatarUrl,
      },
      joinedAt: newMembership.createdAt,
    };
  }

  async removeMember(params: {
    organizationId: string;
    targetUserId: string;
    actorUserId: string;
  }) {
    if (!mongoose.Types.ObjectId.isValid(params.targetUserId)) {
      throw new ValidationError('Invalid target user ID', 'INVALID_USER_ID');
    }

    const membership = await OrganizationMember.findOne({
      organizationId: new mongoose.Types.ObjectId(params.organizationId),
      userId: new mongoose.Types.ObjectId(params.targetUserId),
    });

    if (!membership) {
      throw new NotFoundError('Member not found in this organization', 'MEMBER_NOT_FOUND');
    }

    if (membership.role === 'OWNER') {
      const ownerCount = await OrganizationMember.countDocuments({
        organizationId: new mongoose.Types.ObjectId(params.organizationId),
        role: 'OWNER',
      });
      if (ownerCount <= 1) {
        throw new ForbiddenError(
          'Cannot remove the primary organization OWNER. Transfer ownership first.',
          'CANNOT_REMOVE_SOLE_OWNER'
        );
      }
    }

    await OrganizationMember.deleteOne({ _id: membership._id });

    // Record audit log
    await auditService.log({
      userId: params.actorUserId,
      organizationId: params.organizationId,
      action: 'MEMBER_REMOVED',
      entity: 'OrganizationMember',
      entityId: membership._id.toString(),
      oldValue: {
        userId: params.targetUserId,
        role: membership.role,
      },
    });

    return { success: true, message: 'Member removed successfully' };
  }
}

export const organizationService = new OrganizationService();
