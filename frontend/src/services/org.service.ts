import { apiClient } from './api';
import { Organization, OrganizationMember, UserRole } from '../types';

export const orgService = {
  async getOrganizations(): Promise<Organization[]> {
    const res = await apiClient.get('/organizations');
    return res.data.data;
  },

  async createOrganization(name: string): Promise<Organization> {
    const res = await apiClient.post('/organizations', { name });
    return res.data.data;
  },

  async getOrganizationById(orgId: string): Promise<Organization & { memberCount: number }> {
    const res = await apiClient.get(`/organizations/${orgId}`);
    return res.data.data;
  },

  async getMembers(orgId: string): Promise<OrganizationMember[]> {
    const res = await apiClient.get(`/organizations/${orgId}/members`);
    return res.data.data;
  },

  async addMember(
    orgId: string,
    data: { email?: string; userId?: string; role: UserRole }
  ): Promise<OrganizationMember> {
    const res = await apiClient.post(`/organizations/${orgId}/members`, data);
    return res.data.data;
  },

  async removeMember(orgId: string, userId: string): Promise<{ success: boolean }> {
    const res = await apiClient.delete(`/organizations/${orgId}/members/${userId}`);
    return res.data;
  },
};
