import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useOrganization } from './OrganizationContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinProject: (projectId: string) => void;
  leaveProject: (projectId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const { activeOrg } = useOrganization();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const socketInstance = io('/', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('[Socket] Connected as', user.email);
      setIsConnected(true);

      // Join active organization room
      if (activeOrg) {
        socketInstance.emit('join:organization', { organizationId: activeOrg.id });
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setIsConnected(false);
    });

    socketInstance.on('error:unauthorized', (err) => {
      console.warn('[Socket Unauthorized]', err);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token, user?.id]);

  // When active organization changes, join the corresponding room
  useEffect(() => {
    if (socket && isConnected && activeOrg) {
      socket.emit('join:organization', { organizationId: activeOrg.id });
    }
  }, [socket, isConnected, activeOrg?.id]);

  const joinProject = (projectId: string) => {
    if (socket && isConnected) {
      socket.emit('join:project', { projectId });
    }
  };

  const leaveProject = (projectId: string) => {
    if (socket && isConnected) {
      socket.emit('leave:project', { projectId });
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinProject, leaveProject }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
