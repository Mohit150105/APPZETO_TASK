import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { taskService } from '../services/task.service';
import { AppResponse } from '../utils/apiResponse';
import { ValidationError } from '../utils/errors';

export class TaskController {
  async createTask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.member!.organizationId;
      const result = await taskService.createTask({
        ...req.body,
        organizationId: orgId,
        userId: req.user!.id,
      });
      AppResponse.success(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async getTasks(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.member!.organizationId;
      const {
        projectId,
        status,
        priority,
        assignee,
        labels,
        dueDate,
        createdDate,
        search,
        page,
        limit,
      } = req.query as any;

      const result = await taskService.getTasks({
        organizationId: orgId,
        projectId,
        status,
        priority,
        assignee,
        labels,
        dueDate,
        createdDate,
        search,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      });

      AppResponse.paginated(res, result.data, result.pagination, 200);
    } catch (error) {
      next(error);
    }
  }

  async getTaskById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.member!.organizationId;
      const result = await taskService.getTaskById(req.params.id, orgId);
      AppResponse.success(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  async updateTask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.member!.organizationId;
      const result = await taskService.updateTask(
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

  async deleteTask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.member!.organizationId;
      const result = await taskService.deleteTask(req.params.id, orgId, req.user!.id);
      AppResponse.success(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  async addComment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.member!.organizationId;
      const result = await taskService.addComment({
        taskId: req.params.id,
        organizationId: orgId,
        userId: req.user!.id,
        content: req.body.content,
        mentions: req.body.mentions,
      });
      AppResponse.success(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async getComments(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.member!.organizationId;
      const result = await taskService.getComments(req.params.id, orgId);
      AppResponse.success(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  async uploadAttachment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new ValidationError('No file was provided for upload', 'FILE_MISSING');
      }

      const orgId = req.member!.organizationId;
      const result = await taskService.addAttachment(
        req.params.id,
        orgId,
        req.file,
        req.user!.id
      );

      AppResponse.success(res, result, 201);
    } catch (error) {
      next(error);
    }
  }
}

export const taskController = new TaskController();
