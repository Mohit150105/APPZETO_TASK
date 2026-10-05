import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest, UserRole } from '../types';
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/errors';
import { OrganizationMember } from '../models/OrganizationMember';
import { Project } from '../models/Project';

export const requireOrganizationMember = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ForbiddenError('Authentication required prior to tenant resolution');
    }

    // Resolve organizationId from header, params, query, or body
    let orgId =
      (req.headers['x-organization-id'] as string) ||
      req.params.orgId ||
      req.params.organizationId ||
      (req.baseUrl.includes('/organizations') && req.params.id ? req.params.id : null) ||
      (req.query.organizationId as string) ||
      req.body.organizationId;

    if (!orgId) {
      throw new ValidationError('Organization ID must be provided via x-organization-id header, parameter, or query', 'MISSING_ORG_ID');
    }

    if (!mongoose.Types.ObjectId.isValid(orgId)) {
      throw new ValidationError('Invalid organization ID format', 'INVALID_ORG_ID');
    }

    const membership = await OrganizationMember.findOne({
      organizationId: new mongoose.Types.ObjectId(orgId),
      userId: new mongoose.Types.ObjectId(req.user.id),
    }).lean();

    if (!membership) {
      throw new ForbiddenError(
        'You do not have access to this organization',
        'TENANT_ACCESS_DENIED'
      );
    }

    req.member = {
      organizationId: orgId,
      userId: req.user.id,
      role: membership.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const requireOrganizationRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    try {
      if (!req.member) {
        throw new ForbiddenError('Tenant context missing', 'TENANT_CONTEXT_MISSING');
      }

      if (!allowedRoles.includes(req.member.role)) {
        throw new ForbiddenError(
          `Action requires one of the following roles: ${allowedRoles.join(', ')} (current: ${req.member.role})`,
          'INSUFFICIENT_ROLE'
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireProjectAccess = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.member) {
      throw new ForbiddenError('Tenant context missing', 'TENANT_CONTEXT_MISSING');
    }

    const projectId = req.params.projectId || req.params.id || req.body.projectId;
    if (!projectId) {
      throw new ValidationError('Project ID is required', 'MISSING_PROJECT_ID');
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new ValidationError('Invalid Project ID format', 'INVALID_PROJECT_ID');
    }

    const project = await Project.findOne({
      _id: new mongoose.Types.ObjectId(projectId),
      organizationId: new mongoose.Types.ObjectId(req.member.organizationId),
    }).lean();

    if (!project) {
      throw new NotFoundError(
        'Project not found or does not belong to this organization',
        'PROJECT_NOT_FOUND'
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};
