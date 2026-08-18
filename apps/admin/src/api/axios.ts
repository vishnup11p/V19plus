import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  withCredentials: true,
});

let accessToken: string | null = null;

export function setAdminToken(token: string | null) {
  accessToken = token;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    // Prevent retry loop: don't retry if already retried, or if it's a refresh/login call
    const isRefreshCall = original?.url?.includes('/auth/refresh') || original?.url?.includes('/auth/admin-login') || original?.url?.includes('/auth/login');
    if (
      err.response?.status === 401 &&
      !original._retry &&
      !isRefreshCall
    ) {
      original._retry = true;
      try {
        const { data } = await api.post('/auth/refresh');
        accessToken = data.accessToken;
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshErr) {
        accessToken = null;
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(err);
  }
);

export default api;
