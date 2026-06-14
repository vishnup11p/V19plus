import api from './axios';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string;
  isVerified?: boolean;
  subscription?: {
    plan: string;
    status: string;
    currentPeriodEnd: string;
  };
}

export interface GoogleConfigStatus {
  configured: boolean;
  clientIdPreview: string | null;
  hasClientSecret: boolean;
  redirectUri: string;
  formatValid: boolean;
}

export const authApi = {
  login: (email: string, password?: string, passwordHash?: string) =>
    api.post<{ user: User; accessToken: string }>('/auth/login', { email, password, passwordHash }),
  signup: (email: string, password?: string, passwordHash?: string, name?: string) =>
    api.post<{ user: User; accessToken: string }>('/auth/signup', { email, password, passwordHash, name }),
  supabaseLogin: (accessToken: string) =>
    api.post<{ user: User; accessToken: string }>('/auth/supabase', { accessToken }),
  adminLogin: (email: string, password: string) =>
    api.post<{ user: User; accessToken: string }>('/admin/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post<{ accessToken: string }>('/auth/refresh'),
  me: () => api.get<User>('/auth/me'),
};
