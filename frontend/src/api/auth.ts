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
  googleStatus: () => api.get<GoogleConfigStatus>('/auth/google/status'),
  googleAuthUrl: () => api.get<{ url: string }>('/auth/google/url'),
  googleLogin: (credential: string) =>
    api.post<{ user: User; accessToken: string }>('/auth/google', { credential }),
  adminLogin: (email: string, password: string) =>
    api.post<{ user: User; accessToken: string }>('/admin/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post<{ accessToken: string }>('/auth/refresh'),
  me: () => api.get<User>('/auth/me'),
};
