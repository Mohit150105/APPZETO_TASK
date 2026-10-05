import { apiClient } from './api';
import { Notification } from '../types';
import { PaginatedResponse } from './task.service';

export const notificationService = {
  async getNotifications(page: number = 1, limit: number = 20, read?: boolean): Promise<{
    data: Notification[];
    pagination: PaginatedResponse<Notification>['pagination'];
    unreadCount: number;
  }> {
    const res = await apiClient.get('/notifications', {
      params: { page, limit, read },
    });
    return {
      data: res.data.data,
      pagination: res.data.pagination,
      unreadCount: res.data.unreadCount || 0,
    };
  },

  async markAsRead(id: string): Promise<Notification> {
    const res = await apiClient.patch(`/notifications/${id}/read`);
    return res.data.data;
  },

  async markAllAsRead(): Promise<{ count: number }> {
    const res = await apiClient.patch('/notifications/read-all');
    return res.data.data;
  },
};
