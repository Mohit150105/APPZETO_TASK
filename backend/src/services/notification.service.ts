import mongoose from 'mongoose';
import { Notification, INotification } from '../models/Notification';
import { NotificationType, PaginatedResult } from '../types';
import { emitToUser } from '../sockets/socket.server';
import { NotFoundError } from '../utils/errors';

export interface CreateNotificationInput {
  recipientId: string;
  organizationId: string;
  type: NotificationType;
  message: string;
  relatedEntity?: {
    entityType: string;
    entityId: string;
  };
}

export class NotificationService {
  async notify(input: CreateNotificationInput): Promise<INotification> {
    const notification = await Notification.create({
      recipientId: new mongoose.Types.ObjectId(input.recipientId),
      organizationId: new mongoose.Types.ObjectId(input.organizationId),
      type: input.type,
      message: input.message,
      relatedEntity: input.relatedEntity
        ? {
            entityType: input.relatedEntity.entityType,
            entityId: new mongoose.Types.ObjectId(input.relatedEntity.entityId),
          }
        : undefined,
      read: false,
    });

    const formatted = notification.toJSON();

    // Real-time broadcast to specific user room
    try {
      emitToUser(input.recipientId, 'notification:new', formatted);
    } catch (err) {
      console.error('[NotificationService] Socket emission error', err);
    }

    return notification;
  }

  async getNotifications(
    userId: string,
    organizationId?: string,
    page: number = 1,
    limit: number = 20,
    readFilter?: boolean
  ): Promise<PaginatedResult<any> & { unreadCount: number }> {
    const skip = (Math.max(1, page) - 1) * Math.max(1, limit);

    const query: any = {
      recipientId: new mongoose.Types.ObjectId(userId),
    };

    if (organizationId && mongoose.Types.ObjectId.isValid(organizationId)) {
      query.organizationId = new mongoose.Types.ObjectId(organizationId);
    }

    if (typeof readFilter === 'boolean') {
      query.read = readFilter;
    }

    const [total, unreadCount, docs] = await Promise.all([
      Notification.countDocuments(query),
      Notification.countDocuments({
        recipientId: new mongoose.Types.ObjectId(userId),
        ...(organizationId && mongoose.Types.ObjectId.isValid(organizationId)
          ? { organizationId: new mongoose.Types.ObjectId(organizationId) }
          : {}),
        read: false,
      }),
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return {
      data: docs.map((doc: any) => ({
        id: doc._id.toString(),
        recipientId: doc.recipientId.toString(),
        organizationId: doc.organizationId.toString(),
        type: doc.type,
        message: doc.message,
        relatedEntity: doc.relatedEntity
          ? {
              entityType: doc.relatedEntity.entityType,
              entityId: doc.relatedEntity.entityId?.toString(),
            }
          : undefined,
        read: doc.read,
        createdAt: doc.createdAt,
      })),
      pagination: {
        page: Math.max(1, page),
        limit: Math.max(1, limit),
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      unreadCount,
    };
  }

  async markAsRead(notificationId: string, userId: string): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      throw new NotFoundError('Invalid notification ID', 'INVALID_NOTIFICATION_ID');
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(notificationId),
        recipientId: new mongoose.Types.ObjectId(userId),
      },
      { $set: { read: true } },
      { new: true }
    );

    if (!notification) {
      throw new NotFoundError('Notification not found', 'NOTIFICATION_NOT_FOUND');
    }

    return notification.toJSON();
  }

  async markAllAsRead(userId: string, organizationId?: string): Promise<{ count: number }> {
    const filter: any = {
      recipientId: new mongoose.Types.ObjectId(userId),
      read: false,
    };

    if (organizationId && mongoose.Types.ObjectId.isValid(organizationId)) {
      filter.organizationId = new mongoose.Types.ObjectId(organizationId);
    }

    const result = await Notification.updateMany(filter, { $set: { read: true } });
    return { count: result.modifiedCount };
  }
}

export const notificationService = new NotificationService();
