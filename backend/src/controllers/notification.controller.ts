import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { notificationService } from '../services/notification.service';
import { AppResponse } from '../utils/apiResponse';

export class NotificationController {
  async getNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, read, organizationId } = req.query as any;

      let readFilter: boolean | undefined = undefined;
      if (read === 'true') readFilter = true;
      if (read === 'false') readFilter = false;

      const result = await notificationService.getNotifications(
        req.user!.id,
        organizationId as string,
        page ? Number(page) : 1,
        limit ? Number(limit) : 20,
        readFilter
      );

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        unreadCount: result.unreadCount,
      });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await notificationService.markAsRead(req.params.id, req.user!.id);
      AppResponse.success(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.query.organizationId as string;
      const result = await notificationService.markAllAsRead(req.user!.id, orgId);
      AppResponse.success(res, result, 200);
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
