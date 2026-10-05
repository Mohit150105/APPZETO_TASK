import { apiClient } from './api';
import { Task, Comment, TaskStatus, TaskPriority } from '../types';

export interface TaskFilterParams {
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

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const taskService = {
  async getTasks(params: TaskFilterParams): Promise<PaginatedResponse<Task>> {
    const res = await apiClient.get('/tasks', { params });
    return {
      data: res.data.data,
      pagination: res.data.pagination,
    };
  },

  async getTaskById(taskId: string): Promise<Task> {
    const res = await apiClient.get(`/tasks/${taskId}`);
    return res.data.data;
  },

  async createTask(data: {
    projectId: string;
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string | null;
    labels?: string[];
    dueDate?: string | null;
  }): Promise<Task> {
    const res = await apiClient.post('/tasks', data);
    return res.data.data;
  },

  async updateTask(
    taskId: string,
    data: {
      title?: string;
      description?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      assigneeId?: string | null;
      labels?: string[];
      dueDate?: string | null;
      version?: number;
    }
  ): Promise<Task> {
    const res = await apiClient.put(`/tasks/${taskId}`, data);
    return res.data.data;
  },

  async deleteTask(taskId: string): Promise<{ success: boolean }> {
    const res = await apiClient.delete(`/tasks/${taskId}`);
    return res.data;
  },

  async getComments(taskId: string): Promise<Comment[]> {
    const res = await apiClient.get(`/tasks/${taskId}/comments`);
    return res.data.data;
  },

  async addComment(
    taskId: string,
    data: { content: string; mentions?: string[] }
  ): Promise<Comment> {
    const res = await apiClient.post(`/tasks/${taskId}/comments`, data);
    return res.data.data;
  },

  async uploadAttachment(taskId: string, file: File): Promise<Task> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiClient.post(`/tasks/${taskId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.data;
  },
};
