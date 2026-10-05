import mongoose from 'mongoose';
import { AuditLog, IAuditLog } from '../models/AuditLog';
import { PaginatedResult } from '../types';

export interface CreateAuditEntryInput {
  userId: string;
  organizationId: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: any;
  newValue?: any;
}

export interface AuditQueryFilters {
  organizationId: string;
  entity?: string;
  action?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export class AuditService {
  async log(params: CreateAuditEntryInput): Promise<IAuditLog> {
    try {
      const entry = await AuditLog.create({
        userId: new mongoose.Types.ObjectId(params.userId),
        organizationId: new mongoose.Types.ObjectId(params.organizationId),
        action: params.action,
        entity: params.entity,
        entityId: new mongoose.Types.ObjectId(params.entityId),
        oldValue: params.oldValue,
        newValue: params.newValue,
        timestamp: new Date(),
      });
      return entry;
    } catch (err) {
      console.error('[AuditService] Failed to record audit log', err);
      // Non-fatal error; allow caller operation to proceed
      return null as any;
    }
  }

  async getLogs(filters: AuditQueryFilters): Promise<PaginatedResult<any>> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const query: any = {
      organizationId: new mongoose.Types.ObjectId(filters.organizationId),
    };

    if (filters.entity) {
      query.entity = filters.entity;
    }

    if (filters.action) {
      query.action = filters.action;
    }

    if (filters.userId && mongoose.Types.ObjectId.isValid(filters.userId)) {
      query.userId = new mongoose.Types.ObjectId(filters.userId);
    }

    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
      if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
    }

    const [total, logs] = await Promise.all([
      AuditLog.countDocuments(query),
      AuditLog.find(query)
        .populate('userId', 'name email avatarUrl')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return {
      data: logs.map((log: any) => ({
        id: log._id.toString(),
        userId: log.userId,
        organizationId: log.organizationId.toString(),
        action: log.action,
        entity: log.entity,
        entityId: log.entityId.toString(),
        oldValue: log.oldValue,
        newValue: log.newValue,
        timestamp: log.timestamp,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}

export const auditService = new AuditService();
