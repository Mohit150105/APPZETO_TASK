import mongoose from 'mongoose';
import { Project } from '../models/Project';
import { Task } from '../models/Task';
import { Comment } from '../models/Comment';
import { auditService } from './audit.service';
import { broadcastToOrganization } from '../sockets/socket.server';
import { NotFoundError, ValidationError } from '../utils/errors';

export class ProjectService {
  async createProject(params: {
    organizationId: string;
    name: string;
    description?: string;
    userId: string;
  }) {
    const project = await Project.create({
      organizationId: new mongoose.Types.ObjectId(params.organizationId),
      name: params.name.trim(),
      description: (params.description || '').trim(),
      createdBy: new mongoose.Types.ObjectId(params.userId),
    });

    const projectData = project.toJSON();

    await auditService.log({
      userId: params.userId,
      organizationId: params.organizationId,
      action: 'PROJECT_CREATED',
      entity: 'Project',
      entityId: project._id.toString(),
      newValue: { name: project.name, description: project.description },
    });

    broadcastToOrganization(params.organizationId, 'project:created', projectData);

    return projectData;
  }

  async getProjectsByOrg(organizationId: string) {
    const projects = await Project.find({
      organizationId: new mongoose.Types.ObjectId(organizationId),
    })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email avatarUrl')
      .lean();

    // Attach task count per project
    const projectIds = projects.map((p) => p._id);
    const taskCounts = await Task.aggregate([
      { $match: { projectId: { $in: projectIds } } },
      {
        $group: {
          _id: '$projectId',
          total: { $sum: 1 },
          done: {
            $sum: { $cond: [{ $eq: ['$status', 'DONE'] }, 1, 0] },
          },
        },
      },
    ]);

    const countMap = new Map(taskCounts.map((c) => [c._id.toString(), c]));

    return projects.map((p: any) => ({
      id: p._id.toString(),
      organizationId: p.organizationId.toString(),
      name: p.name,
      description: p.description,
      createdBy: p.createdBy,
      createdAt: p.createdAt,
      taskCount: countMap.get(p._id.toString())?.total || 0,
      doneCount: countMap.get(p._id.toString())?.done || 0,
    }));
  }

  async getProjectById(projectId: string, organizationId: string) {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new ValidationError('Invalid Project ID', 'INVALID_PROJECT_ID');
    }

    const project = await Project.findOne({
      _id: new mongoose.Types.ObjectId(projectId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    })
      .populate('createdBy', 'name email avatarUrl')
      .lean();

    if (!project) {
      throw new NotFoundError(
        'Project not found or does not belong to your organization',
        'PROJECT_NOT_FOUND'
      );
    }

    // Aggregate task counts by status for project dashboard
    const statusCounts = await Task.aggregate([
      { $match: { projectId: project._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const metrics = {
      TODO: 0,
      IN_PROGRESS: 0,
      REVIEW: 0,
      DONE: 0,
      total: 0,
    };

    statusCounts.forEach((s) => {
      if (s._id in metrics) {
        (metrics as any)[s._id] = s.count;
      }
      metrics.total += s.count;
    });

    return {
      id: project._id.toString(),
      organizationId: project.organizationId.toString(),
      name: project.name,
      description: project.description,
      createdBy: project.createdBy,
      createdAt: project.createdAt,
      metrics,
    };
  }

  async updateProject(
    projectId: string,
    organizationId: string,
    updates: { name?: string; description?: string },
    userId: string
  ) {
    const project = await Project.findOne({
      _id: new mongoose.Types.ObjectId(projectId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });

    if (!project) {
      throw new NotFoundError('Project not found', 'PROJECT_NOT_FOUND');
    }

    const oldValue = { name: project.name, description: project.description };

    if (updates.name !== undefined) project.name = updates.name.trim();
    if (updates.description !== undefined) project.description = updates.description.trim();

    await project.save();

    await auditService.log({
      userId,
      organizationId,
      action: 'PROJECT_UPDATED',
      entity: 'Project',
      entityId: project._id.toString(),
      oldValue,
      newValue: { name: project.name, description: project.description },
    });

    const result = project.toJSON();
    broadcastToOrganization(organizationId, 'project:updated', result);
    return result;
  }

  async deleteProject(projectId: string, organizationId: string, userId: string) {
    const project = await Project.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(projectId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });

    if (!project) {
      throw new NotFoundError('Project not found', 'PROJECT_NOT_FOUND');
    }

    // Cascade delete project tasks and comments
    await Task.deleteMany({ projectId: project._id });
    await Comment.deleteMany({ taskId: { $in: await Task.find({ projectId: project._id }).distinct('_id') } });

    await auditService.log({
      userId,
      organizationId,
      action: 'PROJECT_DELETED',
      entity: 'Project',
      entityId: project._id.toString(),
      oldValue: { name: project.name },
    });

    broadcastToOrganization(organizationId, 'project:deleted', { projectId });
    return { success: true, message: 'Project deleted successfully' };
  }
}

export const projectService = new ProjectService();
