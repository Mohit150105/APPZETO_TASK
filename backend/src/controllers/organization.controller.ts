import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { organizationService } from '../services/organization.service';
import { AppResponse } from '../utils/apiResponse';

export class OrganizationController {
  async createOrg(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await organizationService.createOrganization(req.body.name, req.user!.id);
      AppResponse.success(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async getOrgs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await organizationService.getUserOrganizations(req.user!.id);
      AppResponse.success(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  async getOrgById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await organizationService.getOrganizationById(req.params.id, req.user!.id);
      AppResponse.success(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  async addMember(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await organizationService.addMember({
        organizationId: req.params.id,
        targetUserId: req.body.userId,
        email: req.body.email,
        role: req.body.role,
        actorUserId: req.user!.id,
      });
      AppResponse.success(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async removeMember(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await organizationService.removeMember({
        organizationId: req.params.id,
        targetUserId: req.params.userId,
        actorUserId: req.user!.id,
      });
      AppResponse.success(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  async getMembers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await organizationService.getMembers(req.params.id);
      AppResponse.success(res, result, 200);
    } catch (error) {
      next(error);
    }
  }
}

export const organizationController = new OrganizationController();
