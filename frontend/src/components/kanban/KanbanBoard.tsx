import React, { useState, useEffect } from 'react';
import { Task, TaskStatus } from '../../types';
import { KanbanColumn } from './KanbanColumn';
import { taskService } from '../../services/task.service';
import { useSocket } from '../../context/SocketContext';
import { useOrganization } from '../../context/OrganizationContext';

interface KanbanBoardProps {
  projectId: string;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onTaskClick: (task: Task) => void;
  onOpenCreateModal: (status?: TaskStatus) => void;
}

const COLUMNS: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  projectId,
  tasks,
  setTasks,
  onTaskClick,
  onOpenCreateModal,
}) => {
  const { socket, joinProject, leaveProject } = useSocket();
  const { canCreateTasks } = useOrganization();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Join Socket.IO project room for real-time collaboration
  useEffect(() => {
    if (!projectId) return;

    joinProject(projectId);

    if (socket) {
      const handleTaskCreated = (newTask: Task) => {
        if (newTask.projectId === projectId) {
          setTasks((prev) => {
            if (prev.some((t) => t.id === newTask.id)) return prev;
            return [newTask, ...prev];
          });
        }
      };

      const handleTaskUpdated = (updatedTask: Task) => {
        if (updatedTask.projectId === projectId) {
          setTasks((prev) =>
            prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t))
          );
        }
      };

      const handleTaskMoved = (data: { taskId: string; newStatus: TaskStatus; task: Task }) => {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === data.taskId ? { ...t, ...data.task, status: data.newStatus } : t
          )
        );
      };

      const handleTaskDeleted = (data: { taskId: string }) => {
        setTasks((prev) => prev.filter((t) => t.id !== data.taskId));
      };

      socket.on('task:created', handleTaskCreated);
      socket.on('task:updated', handleTaskUpdated);
      socket.on('task:moved', handleTaskMoved);
      socket.on('task:deleted', handleTaskDeleted);

      return () => {
        socket.off('task:created', handleTaskCreated);
        socket.off('task:updated', handleTaskUpdated);
        socket.off('task:moved', handleTaskMoved);
        socket.off('task:deleted', handleTaskDeleted);
        leaveProject(projectId);
      };
    }
  }, [projectId, socket]);

  // Handle Drag & Drop with Optimistic UI & Revert on failure
  const handleTaskDrop = async (taskId: string, newStatus: TaskStatus) => {
    const taskToMove = tasks.find((t) => t.id === taskId);
    if (!taskToMove || taskToMove.status === newStatus) return;

    const previousStatus = taskToMove.status;
    const previousVersion = taskToMove.version;

    // 1. Optimistic Update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: newStatus, version: t.version + 1 } : t
      )
    );
    setErrorMessage(null);

    // 2. Persist to MongoDB backend
    try {
      const serverUpdated = await taskService.updateTask(taskId, {
        status: newStatus,
        version: previousVersion,
      });

      // Reconcile with authoritative server state
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...serverUpdated } : t))
      );
    } catch (err: any) {
      console.error('Task move failed:', err);
      // 3. Rollback UI on error
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: previousStatus, version: previousVersion } : t
        )
      );

      const msg =
        err.response?.data?.message ||
        'Failed to move task. Concurrency conflict or unauthorized action.';
      setErrorMessage(msg);

      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {errorMessage && (
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
            background: 'rgba(239, 68, 68, 0.95)',
            color: 'white',
            padding: '0.65rem 1rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '1rem',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>⚠️ {errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div className="kanban-board">
        {COLUMNS.map((columnStatus) => {
          const columnTasks = tasks.filter((t) => t.status === columnStatus);
          return (
            <KanbanColumn
              key={columnStatus}
              status={columnStatus}
              tasks={columnTasks}
              onTaskClick={onTaskClick}
              onTaskDrop={handleTaskDrop}
              onOpenCreateModal={onOpenCreateModal}
              canCreate={canCreateTasks}
            />
          );
        })}
      </div>
    </div>
  );
};
