import { create } from 'zustand';
import { authApi, User } from '../api/auth';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  googleLogin: (credential: string) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  fetchMe: () => Promise<boolean>;
  setAccessToken: (token: string) => void;
  hasActiveSubscription: () => boolean;
  isAdmin: () => boolean;
}

let activeFetchMePromise: Promise<boolean> | null = null;

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
    if (activeFetchMePromise) {
      return activeFetchMePromise;
    }

    set({ isLoading: true });

    activeFetchMePromise = (async () => {
      try {
        const { data: refreshData } = await authApi.refresh();
        set({ accessToken: refreshData.accessToken });
        const { data } = await authApi.me();
        set({ user: data, isAuthenticated: true, isLoading: false });
        return true;
      } catch {
        set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
        return false;
      } finally {
        activeFetchMePromise = null;
      }
    })();

    return activeFetchMePromise;
  },
}));
