import React from 'react';
import { TaskStatus, TaskPriority, UserRole } from '../../types';

export const StatusBadge: React.FC<{ status: TaskStatus }> = ({ status }) => {
  const map: Record<TaskStatus, { label: string; className: string }> = {
    TODO: { label: 'To Do', className: 'badge-todo' },
    IN_PROGRESS: { label: 'In Progress', className: 'badge-in-progress' },
    REVIEW: { label: 'Review', className: 'badge-review' },
    DONE: { label: 'Done', className: 'badge-done' },
  };
  const item = map[status] || { label: status, className: 'badge-todo' };
  return <span className={`badge ${item.className}`}>{item.label}</span>;
};

export const PriorityBadge: React.FC<{ priority: TaskPriority }> = ({ priority }) => {
  const map: Record<TaskPriority, { label: string; className: string }> = {
    LOW: { label: 'Low', className: 'badge-low' },
    MEDIUM: { label: 'Medium', className: 'badge-medium' },
    HIGH: { label: 'High', className: 'badge-high' },
    URGENT: { label: 'Urgent', className: 'badge-urgent' },
  };
  const item = map[priority] || { label: priority, className: 'badge-medium' };
  return <span className={`badge ${item.className}`}>{item.label}</span>;
};

export const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
  const map: Record<UserRole, { label: string; className: string }> = {
    OWNER: { label: 'Owner', className: 'badge-owner' },
    ADMIN: { label: 'Admin', className: 'badge-admin' },
    MEMBER: { label: 'Member', className: 'badge-member' },
    VIEWER: { label: 'Viewer', className: 'badge-viewer' },
  };
  const item = map[role] || { label: role, className: 'badge-viewer' };
  return <span className={`badge ${item.className}`}>{item.label}</span>;
};
