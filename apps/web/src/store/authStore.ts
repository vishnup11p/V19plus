import { create } from 'zustand';
import { authApi, User } from '../api/auth';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  signup: (email: string, password?: string, name?: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  fetchMe: () => Promise<void>;
  setAccessToken: (token: string) => void;
  hasActiveSubscription: () => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAccessToken: (token) => set({ accessToken: token }),

  hasActiveSubscription: () => {
    const sub = get().user?.subscription;
    return get().user?.role === 'ADMIN' || sub?.status === 'ACTIVE' || sub?.status === 'TRIALING';
  },

  isAdmin: () => get().user?.role === 'ADMIN',

  login: async (email, password) => {
    const { data } = await authApi.login(email, password);
    set({ user: data.user, accessToken: data.accessToken, isAuthenticated: true, isLoading: false });
  },

  signup: async (email, password, name) => {
    const { data } = await authApi.signup(email, password, undefined, name);
    set({ user: data.user, accessToken: data.accessToken, isAuthenticated: true, isLoading: false });
  },

  googleLogin: async (credential) => {
    const { data } = await authApi.googleLogin(credential);
    set({ user: data.user, accessToken: data.accessToken, isAuthenticated: true, isLoading: false });
  },

  adminLogin: async (email, password) => {
    const { data } = await authApi.adminLogin(email, password);
    set({ user: data.user, accessToken: data.accessToken, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
  },

  refresh: async () => {
    const { data } = await authApi.refresh();
    set({ accessToken: data.accessToken });
  },

  fetchMe: async () => {
    set({ isLoading: true });
    try {
      const { data: refreshData } = await authApi.refresh();
      set({ accessToken: refreshData.accessToken });
      const { data } = await authApi.me();
      set({ user: data, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
