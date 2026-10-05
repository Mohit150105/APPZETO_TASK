import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { projectService } from '../services/project.service';
import { AppResponse } from '../utils/apiResponse';

export class ProjectController {
  async createProject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.member!.organizationId;
      const result = await projectService.createProject({
        organizationId: orgId,
        name: req.body.name,
        description: req.body.description,
        userId: req.user!.id,
      });
      AppResponse.success(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async getProjects(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.member!.organizationId;
      const result = await projectService.getProjectsByOrg(orgId);
      AppResponse.success(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  async getProjectById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.member!.organizationId;
      const result = await projectService.getProjectById(req.params.id, orgId);
      AppResponse.success(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  async updateProject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.member!.organizationId;
      const result = await projectService.updateProject(
        req.params.id,
        orgId,
        req.body,
        req.user!.id
      );
      AppResponse.success(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  async deleteProject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.member!.organizationId;
      const result = await projectService.deleteProject(req.params.id, orgId, req.user!.id);
      AppResponse.success(res, result, 200);
    } catch (error) {
      next(error);
    }
  }
}

export const projectController = new ProjectController();
