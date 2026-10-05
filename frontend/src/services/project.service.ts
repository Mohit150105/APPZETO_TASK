import { apiClient } from './api';
import { Project } from '../types';

export const projectService = {
  async getProjects(): Promise<Project[]> {
    const res = await apiClient.get('/projects');
    return res.data.data;
  },

  async getProjectById(projectId: string): Promise<Project> {
    const res = await apiClient.get(`/projects/${projectId}`);
    return res.data.data;
  },

  async createProject(data: { name: string; description?: string }): Promise<Project> {
    const res = await apiClient.post('/projects', data);
    return res.data.data;
  },

  async updateProject(
    projectId: string,
    data: { name?: string; description?: string }
  ): Promise<Project> {
    const res = await apiClient.put(`/projects/${projectId}`, data);
    return res.data.data;
  },

  async deleteProject(projectId: string): Promise<{ success: boolean }> {
    const res = await apiClient.delete(`/projects/${projectId}`);
    return res.data;
  },
};
