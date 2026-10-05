import mongoose, { Document, Schema, Model } from 'mongoose';
import { NotificationType } from '../types';

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  type: NotificationType;
  message: string;
  relatedEntity?: {
    entityType: string;
    entityId: mongoose.Types.ObjectId;
  };
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'TASK_ASSIGNED',
        'TASK_STATUS_CHANGED',
        'MENTION',
        'DUE_DATE_APPROACHING',
        'ORG_INVITE',
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    relatedEntity: {
      entityType: { type: String },
      entityId: { type: Schema.Types.ObjectId },
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// High-performance index for fetching user's unread & latest notifications
notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });

export const Notification: Model<INotification> = mongoose.model<INotification>(
  'Notification',
  notificationSchema
);
