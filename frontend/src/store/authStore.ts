import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, User } from '../api/auth';

export interface ActiveProfile {
  id: string;
  name: string;
  avatarColor: string;
  isKids: boolean;
  pin?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeProfile: ActiveProfile | null;
  googleLogin: (credential: string) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  fetchMe: () => Promise<boolean>;
  setAccessToken: (token: string) => void;
  setActiveProfile: (profile: ActiveProfile | null) => void;
  hasActiveSubscription: () => boolean;
  isAdmin: () => boolean;
}

let activeFetchMePromise: Promise<boolean> | null = null;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
      activeProfile: null,

      setAccessToken: (token) => set({ accessToken: token }),
      setActiveProfile: (profile) => set({ activeProfile: profile }),

      hasActiveSubscription: () => {
        const sub = get().user?.subscription;
        return get().user?.role === 'ADMIN' || sub?.status === 'ACTIVE' || sub?.status === 'TRIALING';
      },

      isAdmin: () => get().user?.role === 'ADMIN',

      googleLogin: async (credential) => {
        const { data } = await authApi.googleLogin(credential);
        set({ user: data.user, accessToken: data.accessToken, isAuthenticated: true, isLoading: false, activeProfile: null });
      },

      adminLogin: async (email, password) => {
        const { data } = await authApi.adminLogin(email, password);
        set({ user: data.user, accessToken: data.accessToken, isAuthenticated: true, isLoading: false, activeProfile: null });
      },

      login: async (email, password) => {
        const { data } = await authApi.login(email, password);
        set({ user: data.user, accessToken: data.accessToken, isAuthenticated: true, isLoading: false, activeProfile: null });
      },

      register: async (email, password, name) => {
        const { data } = await authApi.register(email, password, name);
        set({ user: data.user, accessToken: data.accessToken, isAuthenticated: true, isLoading: false, activeProfile: null });
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // ignore
        }
        set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false, activeProfile: null });
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
            set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false, activeProfile: null });
            return false;
          } finally {
            activeFetchMePromise = null;
          }
        })();

        return activeFetchMePromise;
      },
    }),
    {
      name: 'v19-auth',
      partialize: (state) => ({ activeProfile: state.activeProfile }),
    }
  )
);
