import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: unknown) => void; reject: (e: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

const isAuthEndpoint = (url?: string) =>
  !!url && (
    url.includes('/auth/refresh') ||
    url.includes('/auth/google') ||
    url.includes('/auth/logout') ||
    url.includes('/admin/auth/login') ||
    url.includes('/auth/admin-login') ||
    url.includes('/auth/google/url') ||
    url.includes('/auth/google/callback') ||
    url.includes('/auth/google/status')
  );

const shouldSkipLoginRedirect = () => {
  const path = window.location.pathname;
  return (
    path.startsWith('/login') ||
    path.startsWith('/admin/login') ||
    path === '/' ||
    path.startsWith('/browse') ||
    path.startsWith('/search') ||
    path.startsWith('/title')
  );
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint(originalRequest.url)) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || '/api'}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        useAuthStore.getState().setAccessToken(data.accessToken);
        processQueue(null, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // Force delete the cookie on the client side just in case the backend fails to clear it
        // This prevents middleware redirect loops with stale cookies
        document.cookie = 'refreshToken=; Max-Age=0; path=/';
        document.cookie = 'accessToken=; Max-Age=0; path=/';

        useAuthStore.getState().logout();
        if (!shouldSkipLoginRedirect()) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
