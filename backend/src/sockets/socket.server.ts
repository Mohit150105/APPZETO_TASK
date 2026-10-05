import { Server as HttpServer } from 'http';
import { Server, ServerOptions } from 'socket.io';
import { config } from '../config/env';
import { socketAuthMiddleware } from './socket.auth';
import { registerSocketHandlers } from './socket.handlers';

let io: Server | null = null;

export const initSocketServer = (httpServer: HttpServer): Server => {
  const options: Partial<ServerOptions> = {
    cors: {
      origin: [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      credentials: true,
    },
  };

  io = new Server(httpServer, options);

  // Authenticate socket connections
  io.use(socketAuthMiddleware);

  // Setup connection event
  io.on('connection', (socket) => {
    registerSocketHandlers(io!, socket);
  });

  console.log('[Socket.IO] Server initialized with authentication guards');
  return io;
};

export const getSocketServer = (): Server => {
  if (!io) {
    throw new Error('Socket.IO server has not been initialized');
  }
  return io;
};

// Event Broadcasters
export const broadcastToProject = (projectId: string, event: string, payload: any): void => {
  if (io) {
    io.to(`project:${projectId}`).emit(event, payload);
  }
};

export const broadcastToOrganization = (organizationId: string, event: string, payload: any): void => {
  if (io) {
    io.to(`organization:${organizationId}`).emit(event, payload);
  }
};

export const emitToUser = (userId: string, event: string, payload: any): void => {
  if (io) {
    io.to(`user:${userId}`).emit(event, payload);
  }
};
