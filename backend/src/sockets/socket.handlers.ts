import { Server, Socket } from 'socket.io';
import mongoose from 'mongoose';
import { OrganizationMember } from '../models/OrganizationMember';
import { Project } from '../models/Project';

export const registerSocketHandlers = (_io: Server, socket: Socket): void => {
  const user = socket.data.user;
  if (!user) return;

  // Automatically join personal user room for private notifications
  const userRoom = `user:${user.id}`;
  socket.join(userRoom);
  console.log(`[Socket] User ${user.email} (${user.id}) joined personal room ${userRoom}`);

  // Handle joining organization room
  socket.on('join:organization', async (data: { organizationId: string }) => {
    try {
      const { organizationId } = data || {};
      if (!organizationId || !mongoose.Types.ObjectId.isValid(organizationId)) {
        socket.emit('error:unauthorized', { message: 'Invalid organization ID' });
        return;
      }

      const isMember = await OrganizationMember.exists({
        organizationId: new mongoose.Types.ObjectId(organizationId),
        userId: new mongoose.Types.ObjectId(user.id),
      });

      if (!isMember) {
        socket.emit('error:unauthorized', { message: 'Access denied to organization room' });
        return;
      }

      const orgRoom = `organization:${organizationId}`;
      socket.join(orgRoom);
      socket.emit('joined:organization', { organizationId });
      console.log(`[Socket] User ${user.email} joined ${orgRoom}`);
    } catch (err) {
      console.error('[Socket] join:organization error', err);
      socket.emit('error', { message: 'Internal socket error joining organization' });
    }
  });

  socket.on('leave:organization', (data: { organizationId: string }) => {
    if (data?.organizationId) {
      socket.leave(`organization:${data.organizationId}`);
    }
  });

  // Handle joining project room
  socket.on('join:project', async (data: { projectId: string }) => {
    try {
      const { projectId } = data || {};
      if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
        socket.emit('error:unauthorized', { message: 'Invalid project ID' });
        return;
      }

      const project = await Project.findById(projectId).lean();
      if (!project) {
        socket.emit('error:unauthorized', { message: 'Project not found' });
        return;
      }

      const isMember = await OrganizationMember.exists({
        organizationId: project.organizationId,
        userId: new mongoose.Types.ObjectId(user.id),
      });

      if (!isMember) {
        socket.emit('error:unauthorized', { message: 'Access denied to project room' });
        return;
      }

      const projectRoom = `project:${projectId}`;
      socket.join(projectRoom);
      socket.emit('joined:project', { projectId });
      console.log(`[Socket] User ${user.email} joined ${projectRoom}`);
    } catch (err) {
      console.error('[Socket] join:project error', err);
      socket.emit('error', { message: 'Internal socket error joining project' });
    }
  });

  socket.on('leave:project', (data: { projectId: string }) => {
    if (data?.projectId) {
      socket.leave(`project:${data.projectId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] User ${user.email} disconnected`);
  });
};
