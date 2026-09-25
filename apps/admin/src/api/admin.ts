import api from './axios';

export interface SiteSettings {
  id: string;
  siteName: string;
  tagline: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  footerText: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
}

export interface DashboardStats {
  users: number;
  content: number;
  categories: number;
  watchHistory: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string;
  createdAt: string;
  subscription?: { plan: string; status: string };
}

export interface AdminEpisode {
  id: string;
  number: number;
  title: string;
  description?: string;
  duration?: number;
  thumbnailUrl?: string;
  videoUrl: string;
  isPublished?: boolean;
}

export interface AdminSeason {
  id: string;
  number: number;
  title?: string;
  posterUrl?: string;
  episodes: AdminEpisode[];
}

export interface AdminContent {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: string;
  genre: string[];
  tags: string[];
  releaseYear: number;
  rating: string;
  imdbScore?: number;
  duration?: number;
  thumbnailUrl: string;
  backdropUrl: string;
  videoUrl?: string;
  trailerUrl?: string;
  isOriginal: boolean;
  isFeatured: boolean;
  isPublished: boolean;
  status?: 'ONGOING' | 'COMPLETED';
  language?: string;
  cast?: { id: string; name: string; role: string; photoUrl?: string }[];
  seasons?: AdminSeason[];
}

export interface AuthResponse {
  user: { id: string; email: string; name: string; role: string; avatarUrl?: string };
  accessToken: string;
}

export const authApi = {
  adminLogin: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  firebaseLogin: (accessToken: string) =>
    api.post<AuthResponse>('/auth/firebase', { accessToken }),
  refresh: () => api.post<{ accessToken: string }>('/auth/refresh'),
  me: () => api.get<AuthResponse['user']>('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const adminApi = {
  dashboard: () => api.get<DashboardStats>('/admin/dashboard'),
  getSettings: () => api.get<SiteSettings>('/admin/settings'),
  updateSettings: (data: Partial<SiteSettings>) => api.put<SiteSettings>('/admin/settings', data),
  listCategories: () => api.get<Category[]>('/admin/categories'),
  createCategory: (data: Partial<Category>) => api.post<Category>('/admin/categories', data),
  updateCategory: (id: string, data: Partial<Category>) => api.put<Category>(`/admin/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/admin/categories/${id}`),
  listUsers: () => api.get<AdminUser[]>('/admin/users'),
  updateUserRole: (id: string, role: string) => api.put(`/admin/users/${id}/role`, { role }),
  listContent: () => api.get<AdminContent[]>('/admin/content'),
  createContent: (data: Partial<AdminContent>) => api.post('/admin/content', data),
  updateContent: (id: string, data: Partial<AdminContent>) => api.put(`/admin/content/${id}`, data),
  deleteContent: (id: string) => api.delete(`/admin/content/${id}`),
  uploadVideo: (formData: FormData, onProgress?: (progressEvent: any) => void) => api.post('/video-process/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 600_000,
    onUploadProgress: onProgress,
  }),
};
