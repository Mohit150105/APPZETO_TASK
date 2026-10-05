import { apiClient } from './api';
import { AuditLog } from '../types';
import { PaginatedResponse } from './task.service';

export interface AuditLogFilters {
  entity?: string;
  action?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const auditService = {
  async getAuditLogs(params: AuditLogFilters): Promise<PaginatedResponse<AuditLog>> {
    const res = await apiClient.get('/audit-logs', { params });
    return {
      data: res.data.data,
      pagination: res.data.pagination,
    };
  },
};
