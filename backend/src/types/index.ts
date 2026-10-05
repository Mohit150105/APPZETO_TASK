import { Request } from 'express';
import { Types } from 'mongoose';

export type UserRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_STATUS_CHANGED'
  | 'MENTION'
  | 'DUE_DATE_APPROACHING'
  | 'ORG_INVITE';

export interface IUserPayload {
  id: string;
  email: string;
  name: string;
}

export interface IOrgMemberContext {
  organizationId: string;
  userId: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: IUserPayload;
  member?: IOrgMemberContext;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
