import { apiClient } from './api';
import { User, Organization } from '../types';

export interface AuthResponse {
  user: User;
  token: string;
}

export interface MeResponse {
  user: User;
  organizations: Organization[];
}

export const authService = {
  async register(data: { name: string; email: string; password: string }): Promise<AuthResponse> {
    const res = await apiClient.post('/auth/register', data);
    return res.data.data;
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const res = await apiClient.post('/auth/login', data);
    return res.data.data;
  },

  async getMe(): Promise<MeResponse> {
    const res = await apiClient.get('/auth/me');
    return res.data.data;
  },
};
