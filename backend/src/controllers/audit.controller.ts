import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { auditService } from '../services/audit.service';
import { AppResponse } from '../utils/apiResponse';

export class AuditController {
  async getAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.member!.organizationId;
      const { entity, action, userId, startDate, endDate, page, limit } = req.query as any;

      const result = await auditService.getLogs({
        organizationId: orgId,
        entity,
        action,
        userId,
        startDate,
        endDate,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      });

      AppResponse.paginated(res, result.data, result.pagination, 200);
    } catch (error) {
      next(error);
    }
  }
}

export const auditController = new AuditController();
