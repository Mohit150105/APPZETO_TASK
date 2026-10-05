export type UserRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt?: string;
}

export interface Organization {
  id: string;
  name: string;
  role: UserRole;
  createdBy?: string;
  createdAt?: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  role: UserRole;
  user: User | null;
  joinedAt: string;
}

export interface ProjectMetrics {
  TODO: number;
  IN_PROGRESS: number;
  REVIEW: number;
  DONE: number;
  total: number;
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  createdBy?: User;
  createdAt: string;
  taskCount?: number;
  doneCount?: number;
  metrics?: ProjectMetrics;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedBy?: User;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  organizationId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: User | null;
  labels: string[];
  attachmentsCount?: number;
  attachments?: Attachment[];
  dueDate?: string | null;
  createdBy?: User;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  organizationId: string;
  content: string;
  mentions: string[];
  user: User;
  createdAt: string;
}

export interface Notification {
  id: string;
  recipientId: string;
  organizationId: string;
  type: string;
  message: string;
  relatedEntity?: {
    entityType: string;
    entityId: string;
  };
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: User;
  organizationId: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue: any;
  newValue: any;
  timestamp: string;
}
