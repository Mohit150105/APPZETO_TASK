import mongoose from 'mongoose';
import { Task, ITask } from '../models/Task';
import { Project } from '../models/Project';
import { OrganizationMember } from '../models/OrganizationMember';
import { Comment } from '../models/Comment';
import { auditService } from './audit.service';
import { notificationService } from './notification.service';
import { broadcastToProject } from '../sockets/socket.server';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  ForbiddenError,
} from '../utils/errors';
import { PaginatedResult, TaskPriority, TaskStatus } from '../types';

export interface CreateTaskInput {
  organizationId: string;
  projectId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  labels?: string[];
  dueDate?: string | null;
  userId: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  labels?: string[];
  dueDate?: string | null;
  version?: number;
}

export interface TaskQueryFilters {
  organizationId: string;
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee?: string;
  labels?: string;
  dueDate?: string;
  createdDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class TaskService {
  async createTask(input: CreateTaskInput) {
    // 1. Verify Project belongs to Organization
    const project = await Project.findOne({
      _id: new mongoose.Types.ObjectId(input.projectId),
      organizationId: new mongoose.Types.ObjectId(input.organizationId),
    }).lean();

    if (!project) {
      throw new NotFoundError(
        'Project not found in this organization',
        'PROJECT_NOT_FOUND'
      );
    }

    // 2. If Assignee is specified, verify membership
    let assigneeObjectId: mongoose.Types.ObjectId | null = null;
    if (input.assigneeId) {
      if (!mongoose.Types.ObjectId.isValid(input.assigneeId)) {
        throw new ValidationError('Invalid assignee ID format', 'INVALID_ASSIGNEE_ID');
      }
      const isMember = await OrganizationMember.exists({
        organizationId: new mongoose.Types.ObjectId(input.organizationId),
        userId: new mongoose.Types.ObjectId(input.assigneeId),
      });
      if (!isMember) {
        throw new ValidationError(
          'Assignee must be a member of the organization',
          'ASSIGNEE_NOT_ORG_MEMBER'
        );
      }
      assigneeObjectId = new mongoose.Types.ObjectId(input.assigneeId);
    }

    const task = await Task.create({
      organizationId: new mongoose.Types.ObjectId(input.organizationId),
      projectId: new mongoose.Types.ObjectId(input.projectId),
      title: input.title.trim(),
      description: (input.description || '').trim(),
      status: input.status || 'TODO',
      priority: input.priority || 'MEDIUM',
      assigneeId: assigneeObjectId,
      labels: input.labels || [],
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      createdBy: new mongoose.Types.ObjectId(input.userId),
      version: 1,
    });

    const populated = await Task.findById(task._id)
      .populate('assigneeId', 'name email avatarUrl')
      .populate('createdBy', 'name email avatarUrl')
      .lean();

    const result = {
      id: populated!._id.toString(),
      ...populated,
      _id: undefined,
    };

    // Audit log
    await auditService.log({
      userId: input.userId,
      organizationId: input.organizationId,
      action: 'TASK_CREATED',
      entity: 'Task',
      entityId: task._id.toString(),
      newValue: {
        title: task.title,
        status: task.status,
        priority: task.priority,
        projectId: input.projectId,
      },
    });

    // Real-time broadcast
    broadcastToProject(input.projectId, 'task:created', result);

    // Notification to assignee
    if (input.assigneeId && input.assigneeId !== input.userId) {
      await notificationService.notify({
        recipientId: input.assigneeId,
        organizationId: input.organizationId,
        type: 'TASK_ASSIGNED',
        message: `You were assigned to task "${task.title}"`,
        relatedEntity: {
          entityType: 'Task',
          entityId: task._id.toString(),
        },
      });
    }

    return result;
  }

  async getTasks(filters: TaskQueryFilters): Promise<PaginatedResult<any>> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const query: any = {
      organizationId: new mongoose.Types.ObjectId(filters.organizationId),
    };

    if (filters.projectId && mongoose.Types.ObjectId.isValid(filters.projectId)) {
      query.projectId = new mongoose.Types.ObjectId(filters.projectId);
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.priority) {
      query.priority = filters.priority;
    }

    if (filters.assignee) {
      if (filters.assignee === 'unassigned') {
        query.assigneeId = null;
      } else if (mongoose.Types.ObjectId.isValid(filters.assignee)) {
        query.assigneeId = new mongoose.Types.ObjectId(filters.assignee);
      }
    }

    if (filters.labels) {
      const labelList = filters.labels.split(',').map((l) => l.trim()).filter(Boolean);
      if (labelList.length > 0) {
        query.labels = { $in: labelList };
      }
    }

    if (filters.dueDate) {
      // Find tasks due on or before date
      const date = new Date(filters.dueDate);
      date.setHours(23, 59, 59, 999);
      query.dueDate = { $lte: date };
    }

    if (filters.createdDate) {
      const start = new Date(filters.createdDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(filters.createdDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: start, $lte: end };
    }

    // Text search query across title & description
    if (filters.search && filters.search.trim()) {
      const searchRegex = new RegExp(filters.search.trim(), 'i');
      query.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    const [total, tasks] = await Promise.all([
      Task.countDocuments(query),
      Task.find(query)
        .populate('assigneeId', 'name email avatarUrl')
        .populate('createdBy', 'name email avatarUrl')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return {
      data: tasks.map((t: any) => ({
        id: t._id.toString(),
        projectId: t.projectId.toString(),
        organizationId: t.organizationId.toString(),
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        assignee: t.assigneeId
          ? {
              id: t.assigneeId._id.toString(),
              name: t.assigneeId.name,
              email: t.assigneeId.email,
              avatarUrl: t.assigneeId.avatarUrl,
            }
          : null,
        labels: t.labels,
        attachmentsCount: t.attachments?.length || 0,
        dueDate: t.dueDate,
        createdBy: t.createdBy
          ? {
              id: t.createdBy._id.toString(),
              name: t.createdBy.name,
              email: t.createdBy.email,
            }
          : null,
        version: t.version,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getTaskById(taskId: string, organizationId: string) {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      throw new ValidationError('Invalid Task ID format', 'INVALID_TASK_ID');
    }

    const task = await Task.findOne({
      _id: new mongoose.Types.ObjectId(taskId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    })
      .populate('assigneeId', 'name email avatarUrl')
      .populate('createdBy', 'name email avatarUrl')
      .populate('attachments.uploadedBy', 'name email avatarUrl')
      .lean();

    if (!task) {
      throw new NotFoundError('Task not found in this organization', 'TASK_NOT_FOUND');
    }

    return {
      id: task._id.toString(),
      projectId: task.projectId.toString(),
      organizationId: task.organizationId.toString(),
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignee: task.assigneeId
        ? {
            id: (task.assigneeId as any)._id.toString(),
            name: (task.assigneeId as any).name,
            email: (task.assigneeId as any).email,
            avatarUrl: (task.assigneeId as any).avatarUrl,
          }
        : null,
      labels: task.labels,
      attachments: task.attachments.map((a: any) => ({
        id: a._id.toString(),
        name: a.name,
        url: a.url,
        size: a.size,
        mimeType: a.mimeType,
        uploadedBy: a.uploadedBy
          ? {
              id: a.uploadedBy._id.toString(),
              name: a.uploadedBy.name,
              email: a.uploadedBy.email,
            }
          : null,
        createdAt: a.createdAt,
      })),
      dueDate: task.dueDate,
      createdBy: task.createdBy
        ? {
            id: (task.createdBy as any)._id.toString(),
            name: (task.createdBy as any).name,
            email: (task.createdBy as any).email,
          }
        : null,
      version: task.version,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }

  async updateTask(
    taskId: string,
    organizationId: string,
    updates: UpdateTaskInput,
    userId: string
  ) {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      throw new ValidationError('Invalid Task ID format', 'INVALID_TASK_ID');
    }

    // 1. Fetch current task state
    const currentTask = await Task.findOne({
      _id: new mongoose.Types.ObjectId(taskId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });

    if (!currentTask) {
      throw new NotFoundError('Task not found in this organization', 'TASK_NOT_FOUND');
    }

    // 2. Concurrency Check: If client provided version, ensure it matches
    if (typeof updates.version === 'number' && updates.version !== currentTask.version) {
      throw new ConflictError(
        'This task was modified by another user. Please reload the task to view latest changes.',
        'CONCURRENT_MODIFICATION'
      );
    }

    // 3. If assignee is updated, verify membership
    let newAssigneeId: mongoose.Types.ObjectId | null = currentTask.assigneeId || null;
    if (updates.assigneeId !== undefined) {
      if (updates.assigneeId === null || updates.assigneeId === '') {
        newAssigneeId = null;
      } else {
        if (!mongoose.Types.ObjectId.isValid(updates.assigneeId)) {
          throw new ValidationError('Invalid assignee ID format', 'INVALID_ASSIGNEE_ID');
        }
        const isMember = await OrganizationMember.exists({
          organizationId: new mongoose.Types.ObjectId(organizationId),
          userId: new mongoose.Types.ObjectId(updates.assigneeId),
        });
        if (!isMember) {
          throw new ValidationError(
            'Assignee must be a member of the organization',
            'ASSIGNEE_NOT_ORG_MEMBER'
          );
        }
        newAssigneeId = new mongoose.Types.ObjectId(updates.assigneeId);
      }
    }

    // Prepare atomic update payload
    const updateFields: any = {};
    const oldValues: any = {};
    const newValues: any = {};

    if (updates.title !== undefined && updates.title !== currentTask.title) {
      updateFields.title = updates.title.trim();
      oldValues.title = currentTask.title;
      newValues.title = updateFields.title;
    }

    if (updates.description !== undefined && updates.description !== currentTask.description) {
      updateFields.description = updates.description.trim();
      oldValues.description = currentTask.description;
      newValues.description = updateFields.description;
    }

    const isStatusChanged = updates.status !== undefined && updates.status !== currentTask.status;
    if (isStatusChanged) {
      updateFields.status = updates.status;
      oldValues.status = currentTask.status;
      newValues.status = updates.status;
    }

    if (updates.priority !== undefined && updates.priority !== currentTask.priority) {
      updateFields.priority = updates.priority;
      oldValues.priority = currentTask.priority;
      newValues.priority = updates.priority;
    }

    const isAssigneeChanged =
      updates.assigneeId !== undefined &&
      (newAssigneeId?.toString() || null) !== (currentTask.assigneeId?.toString() || null);

    if (isAssigneeChanged) {
      updateFields.assigneeId = newAssigneeId;
      oldValues.assigneeId = currentTask.assigneeId?.toString() || null;
      newValues.assigneeId = newAssigneeId?.toString() || null;
    }

    if (updates.labels !== undefined) {
      updateFields.labels = updates.labels;
      oldValues.labels = currentTask.labels;
      newValues.labels = updates.labels;
    }

    if (updates.dueDate !== undefined) {
      updateFields.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
      oldValues.dueDate = currentTask.dueDate;
      newValues.dueDate = updateFields.dueDate;
    }

    // 4. Perform atomic update with incremented version
    const updatedTask = await Task.findOneAndUpdate(
      {
        _id: currentTask._id,
        organizationId: new mongoose.Types.ObjectId(organizationId),
        version: currentTask.version,
      },
      {
        $set: updateFields,
        $inc: { version: 1 },
      },
      { new: true }
    )
      .populate('assigneeId', 'name email avatarUrl')
      .populate('createdBy', 'name email avatarUrl')
      .lean();

    if (!updatedTask) {
      throw new ConflictError(
        'Concurrent task update conflict. Please refresh and retry.',
        'CONCURRENT_MODIFICATION'
      );
    }

    const formatted = {
      id: updatedTask._id.toString(),
      ...updatedTask,
      _id: undefined,
    };

    // 5. Audit Logging
    if (Object.keys(newValues).length > 0) {
      let action = 'TASK_UPDATED';
      if (isStatusChanged) action = 'TASK_STATUS_CHANGED';
      else if (isAssigneeChanged) action = 'TASK_ASSIGNED';

      await auditService.log({
        userId,
        organizationId,
        action,
        entity: 'Task',
        entityId: currentTask._id.toString(),
        oldValue: oldValues,
        newValue: newValues,
      });
    }

    // 6. Broadcast Real-Time Events
    const projectIdStr = currentTask.projectId.toString();
    if (isStatusChanged) {
      broadcastToProject(projectIdStr, 'task:moved', {
        taskId: formatted.id,
        projectId: projectIdStr,
        oldStatus: currentTask.status,
        newStatus: updatedTask.status,
        task: formatted,
      });

      // Notify task creator and previous assignee of status change
      const recipients = new Set<string>();
      if (currentTask.createdBy.toString() !== userId) {
        recipients.add(currentTask.createdBy.toString());
      }
      if (currentTask.assigneeId && currentTask.assigneeId.toString() !== userId) {
        recipients.add(currentTask.assigneeId.toString());
      }

      for (const recId of recipients) {
        await notificationService.notify({
          recipientId: recId,
          organizationId,
          type: 'TASK_STATUS_CHANGED',
          message: `Task "${currentTask.title}" status changed to ${updatedTask.status}`,
          relatedEntity: { entityType: 'Task', entityId: formatted.id },
        });
      }
    } else {
      broadcastToProject(projectIdStr, 'task:updated', formatted);
    }

    // Notify new assignee if changed
    if (isAssigneeChanged && newAssigneeId && newAssigneeId.toString() !== userId) {
      await notificationService.notify({
        recipientId: newAssigneeId.toString(),
        organizationId,
        type: 'TASK_ASSIGNED',
        message: `You were assigned to task "${currentTask.title}"`,
        relatedEntity: { entityType: 'Task', entityId: formatted.id },
      });
    }

    return formatted;
  }

  async deleteTask(taskId: string, organizationId: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      throw new ValidationError('Invalid Task ID format', 'INVALID_TASK_ID');
    }

    const task = await Task.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(taskId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });

    if (!task) {
      throw new NotFoundError('Task not found in this organization', 'TASK_NOT_FOUND');
    }

    // Delete associated comments
    await Comment.deleteMany({ taskId: task._id });

    // Log audit
    await auditService.log({
      userId,
      organizationId,
      action: 'TASK_DELETED',
      entity: 'Task',
      entityId: task._id.toString(),
      oldValue: { title: task.title, status: task.status },
    });

    // Real-time broadcast
    broadcastToProject(task.projectId.toString(), 'task:deleted', {
      taskId: task._id.toString(),
      projectId: task.projectId.toString(),
    });

    return { success: true, message: 'Task deleted successfully' };
  }

  async addComment(params: {
    taskId: string;
    organizationId: string;
    userId: string;
    content: string;
    mentions?: string[];
  }) {
    if (!mongoose.Types.ObjectId.isValid(params.taskId)) {
      throw new ValidationError('Invalid Task ID', 'INVALID_TASK_ID');
    }

    const task = await Task.findOne({
      _id: new mongoose.Types.ObjectId(params.taskId),
      organizationId: new mongoose.Types.ObjectId(params.organizationId),
    });

    if (!task) {
      throw new NotFoundError('Task not found', 'TASK_NOT_FOUND');
    }

    const validMentions: mongoose.Types.ObjectId[] = [];
    if (params.mentions && params.mentions.length > 0) {
      for (const mId of params.mentions) {
        if (mongoose.Types.ObjectId.isValid(mId)) {
          validMentions.push(new mongoose.Types.ObjectId(mId));
        }
      }
    }

    const comment = await Comment.create({
      taskId: task._id,
      organizationId: new mongoose.Types.ObjectId(params.organizationId),
      userId: new mongoose.Types.ObjectId(params.userId),
      content: params.content.trim(),
      mentions: validMentions,
    });

    const populated = await Comment.findById(comment._id)
      .populate('userId', 'name email avatarUrl')
      .lean();

    const formatted = {
      id: populated!._id.toString(),
      taskId: populated!.taskId.toString(),
      organizationId: populated!.organizationId.toString(),
      content: populated!.content,
      mentions: populated!.mentions,
      user: populated!.userId,
      createdAt: populated!.createdAt,
    };

    // Audit log
    await auditService.log({
      userId: params.userId,
      organizationId: params.organizationId,
      action: 'COMMENT_ADDED',
      entity: 'Comment',
      entityId: comment._id.toString(),
      newValue: { taskId: params.taskId },
    });

    // Broadcast to project room
    broadcastToProject(task.projectId.toString(), 'comment:created', formatted);

    // Send notifications to mentioned users
    for (const mentionId of validMentions) {
      if (mentionId.toString() !== params.userId) {
        await notificationService.notify({
          recipientId: mentionId.toString(),
          organizationId: params.organizationId,
          type: 'MENTION',
          message: `You were mentioned in a comment on task "${task.title}"`,
          relatedEntity: {
            entityType: 'Task',
            entityId: task._id.toString(),
          },
        });
      }
    }

    return formatted;
  }

  async getComments(taskId: string, organizationId: string) {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      throw new ValidationError('Invalid Task ID', 'INVALID_TASK_ID');
    }

    const comments = await Comment.find({
      taskId: new mongoose.Types.ObjectId(taskId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    })
      .populate('userId', 'name email avatarUrl')
      .sort({ createdAt: 1 })
      .lean();

    return comments.map((c: any) => ({
      id: c._id.toString(),
      taskId: c.taskId.toString(),
      organizationId: c.organizationId.toString(),
      content: c.content,
      mentions: c.mentions,
      user: c.userId,
      createdAt: c.createdAt,
    }));
  }

  async addAttachment(
    taskId: string,
    organizationId: string,
    file: Express.Multer.File,
    userId: string
  ) {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      throw new ValidationError('Invalid Task ID', 'INVALID_TASK_ID');
    }

    const task = await Task.findOne({
      _id: new mongoose.Types.ObjectId(taskId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });

    if (!task) {
      throw new NotFoundError('Task not found', 'TASK_NOT_FOUND');
    }

    const attachment = {
      name: file.originalname,
      url: `/uploads/${file.filename}`,
      size: file.size,
      mimeType: file.mimetype,
      uploadedBy: new mongoose.Types.ObjectId(userId),
      createdAt: new Date(),
    };

    task.attachments.push(attachment as any);
    await task.save();

    await auditService.log({
      userId,
      organizationId,
      action: 'ATTACHMENT_ADDED',
      entity: 'Task',
      entityId: task._id.toString(),
      newValue: { fileName: file.originalname, fileSize: file.size },
    });

    const populated = await Task.findById(task._id)
      .populate('assigneeId', 'name email avatarUrl')
      .populate('createdBy', 'name email avatarUrl')
      .populate('attachments.uploadedBy', 'name email avatarUrl')
      .lean();

    const formatted = {
      id: populated!._id.toString(),
      ...populated,
      _id: undefined,
    };

    broadcastToProject(task.projectId.toString(), 'task:updated', formatted);

    return formatted;
  }
}

export const taskService = new TaskService();
