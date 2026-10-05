import mongoose, { Document, Schema, Model } from 'mongoose';
import { TaskPriority, TaskStatus } from '../types';

export interface IAttachment {
  name: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface ITask extends Document {
  organizationId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: mongoose.Types.ObjectId | null;
  labels: string[];
  attachments: IAttachment[];
  dueDate?: Date | null;
  createdBy: mongoose.Types.ObjectId;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const attachmentSchema = new Schema<IAttachment>(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    size: { type: Number, required: true },
    mimeType: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const taskSchema = new Schema<ITask>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'],
      default: 'TODO',
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
      required: true,
      index: true,
    },
    assigneeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    labels: {
      type: [String],
      default: [],
      index: true,
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    dueDate: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    version: {
      type: Number,
      default: 1,
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

// High-performance compound indexes for scale (100k tasks)
taskSchema.index({ organizationId: 1, projectId: 1, status: 1 });
taskSchema.index({ projectId: 1, status: 1, createdAt: -1 });
taskSchema.index({ organizationId: 1, assigneeId: 1, status: 1 });
taskSchema.index({ organizationId: 1, dueDate: 1 });
taskSchema.index({ title: 'text', description: 'text' });

export const Task: Model<ITask> = mongoose.model<ITask>('Task', taskSchema);
