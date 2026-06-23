import { create } from 'zustand';
import { authApi, User } from '../api/auth';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _initialized: boolean;
  checkEmail: (email: string) => Promise<boolean>;
  login: (email: string, password?: string) => Promise<void>;
  signup: (email: string, password?: string, name?: string) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  fetchMe: () => Promise<void>;
  setAccessToken: (token: string) => void;
  hasActiveSubscription: () => boolean;
  isAdmin: () => boolean;
}

// Generate or retrieve a persistent device ID for this browser
const getDeviceInfo = () => {
  if (typeof window === 'undefined') return {};
  
  let deviceId = localStorage.getItem('v19_device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    localStorage.setItem('v19_device_id', deviceId);
  }

  return {
    deviceId,
    deviceName: navigator.userAgent.split(' ')[0] || 'Web Browser',
    deviceType: 'WEB',
  };
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  _initialized: false,

  setAccessToken: (token) => set({ accessToken: token }),

  hasActiveSubscription: () => {
    const sub = get().user?.subscription;
    return get().user?.role === 'ADMIN' || sub?.status === 'ACTIVE' || sub?.status === 'TRIALING';
  },

  isAdmin: () => get().user?.role === 'ADMIN',

  checkEmail: async (email: string) => {
    const { data } = await authApi.checkEmail(email);
    return data.exists;
  },

  login: async (email, password) => {
    const { data } = await authApi.login(email, password, undefined, getDeviceInfo());
    set({ user: data.user, accessToken: data.accessToken, isAuthenticated: true, isLoading: false, _initialized: true });
  },

  signup: async (email, password, name) => {
    const { data } = await authApi.signup(email, password, undefined, name, getDeviceInfo());
    set({ user: data.user, accessToken: data.accessToken, isAuthenticated: true, isLoading: false, _initialized: true });
  },

  adminLogin: async (email, password) => {
    const { data } = await authApi.adminLogin(email, password, getDeviceInfo());
    set({ user: data.user, accessToken: data.accessToken, isAuthenticated: true, isLoading: false, _initialized: true });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('v19_active_profile');
      document.cookie = 'v19_active_profile_id=; Max-Age=0; path=/';
    }
    set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false, _initialized: true });
  },

  refresh: async () => {
    const { data } = await authApi.refresh();
    set({ accessToken: data.accessToken });
  },

  fetchMe: async () => {
    if (!get()._initialized) {
      set({ isLoading: true });
    }
    try {
      // Attempt refresh first to get short-lived access token
      const { data: refreshData } = await authApi.refresh();
      set({ accessToken: refreshData.accessToken });
      // Now fetch user details
      const { data } = await authApi.me();
      set({ user: data, isAuthenticated: true, isLoading: false, _initialized: true });
    } catch {
      set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false, _initialized: true });
    }
  },
}));
