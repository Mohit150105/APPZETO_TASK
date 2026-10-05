import React, { useState } from 'react';
import { Task, TaskStatus } from '../../types';
import { TaskCard } from './TaskCard';
import { StatusBadge } from '../ui/Badge';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskDrop: (taskId: string, newStatus: TaskStatus) => void;
  onOpenCreateModal?: (status: TaskStatus) => void;
  canCreate: boolean;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  tasks,
  onTaskClick,
  onTaskDrop,
  onOpenCreateModal,
  canCreate,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onTaskDrop(taskId, status);
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  return (
    <div className="kanban-column">
      {/* Column Header */}
      <div className="kanban-column-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <StatusBadge status={status} />
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--text-subtle)',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '2px 8px',
              borderRadius: '10px',
            }}
          >
            {tasks.length}
          </span>
        </div>

        {canCreate && onOpenCreateModal && (
          <button
            onClick={() => onOpenCreateModal(status)}
            title="Add task in this column"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              padding: '3px',
              borderRadius: '4px',
            }}
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      {/* Droppable Task List */}
      <div
        className={`kanban-task-list ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {tasks.length === 0 ? (
          <div
            style={{
              height: '100px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-subtle)',
              fontSize: '0.8rem',
              border: '1px dashed var(--border-subtle)',
              borderRadius: '8px',
            }}
          >
            No tasks
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={onTaskClick}
              onDragStart={handleDragStart}
            />
          ))
        )}
      </div>
    </div>
  );
};
