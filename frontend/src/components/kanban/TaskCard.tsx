import React from 'react';
import { Task } from '../../types';
import { PriorityBadge } from '../ui/Badge';
import { Calendar, Paperclip } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, onDragStart }) => {
  const isOverdue =
    task.dueDate &&
    task.status !== 'DONE' &&
    new Date(task.dueDate).getTime() < Date.now();

  return (
    <div
      className="task-card"
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={() => onClick(task)}
    >
      {/* Priority Badge & Version indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.65rem',
        }}
      >
        <PriorityBadge priority={task.priority} />
        <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
          v{task.version}
        </span>
      </div>

      {/* Task Title */}
      <h4
        style={{
          fontSize: '0.9rem',
          fontWeight: 600,
          color: 'var(--text-main)',
          marginBottom: '0.5rem',
          lineHeight: 1.35,
        }}
      >
        {task.title}
      </h4>

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
          {task.labels.map((label, idx) => (
            <span
              key={idx}
              style={{
                fontSize: '0.7rem',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                padding: '1px 6px',
                borderRadius: '4px',
              }}
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Card Footer: Due Date, Attachments, Assignee */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '0.5rem',
          paddingTop: '0.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {task.dueDate && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.75rem',
                color: isOverdue ? '#ef4444' : 'var(--text-subtle)',
                fontWeight: isOverdue ? 700 : 500,
              }}
            >
              <Calendar size={13} />
              <span>
                {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
            </div>
          )}

          {Boolean(task.attachmentsCount && task.attachmentsCount > 0) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
                fontSize: '0.75rem',
                color: 'var(--text-subtle)',
              }}
            >
              <Paperclip size={13} />
              <span>{task.attachmentsCount}</span>
            </div>
          )}
        </div>

        {/* Assignee Avatar */}
        {task.assignee ? (
          <div className="avatar" title={`Assigned to: ${task.assignee.name}`}>
            {task.assignee.avatarUrl ? (
              <img src={task.assignee.avatarUrl} alt={task.assignee.name} />
            ) : (
              task.assignee.name.slice(0, 2).toUpperCase()
            )}
          </div>
        ) : (
          <div
            title="Unassigned"
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              border: '1px dashed var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.65rem',
              color: 'var(--text-subtle)',
            }}
          >
            ?
          </div>
        )}
      </div>
    </div>
  );
};
