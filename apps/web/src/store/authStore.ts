import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, User } from '../api/auth';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
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
export const getDeviceInfo = () => {
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
      _initialized: false,

      setAccessToken: (token) => set({ accessToken: token }),

      hasActiveSubscription: () => {
        // FREE TIER: All users have full access. Uncomment below when subscriptions are activated.
        return true;
        // const sub = get().user?.subscription;
        // return get().user?.role === 'ADMIN' || sub?.status === 'ACTIVE' || sub?.status === 'TRIALING';
      },

      isAdmin: () => get().user?.role === 'ADMIN',

      checkEmail: async (email: string) => {
        const { data } = await authApi.checkEmail(email);
        return data.exists;
      },

      login: async (email, password) => {
        const { data } = await authApi.login(email, password, undefined, getDeviceInfo());
        if (typeof window !== 'undefined') {
          document.cookie = `refreshToken=${data.refreshToken}; path=/; max-age=31536000; SameSite=Lax; Secure`;
          document.cookie = `accessToken=${data.accessToken}; path=/; max-age=86400; SameSite=Lax; Secure`;
        }
        set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken, isAuthenticated: true, isLoading: false, _initialized: true });
      },

      signup: async (email, password, name) => {
        const { data } = await authApi.signup(email, password, undefined, name, getDeviceInfo());
        if (typeof window !== 'undefined') {
          document.cookie = `refreshToken=${data.refreshToken}; path=/; max-age=31536000; SameSite=Lax; Secure`;
          document.cookie = `accessToken=${data.accessToken}; path=/; max-age=86400; SameSite=Lax; Secure`;
        }
        set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken, isAuthenticated: true, isLoading: false, _initialized: true });
      },

      adminLogin: async (email, password) => {
        const { data } = await authApi.adminLogin(email, password, getDeviceInfo());
        if (typeof window !== 'undefined') {
          document.cookie = `refreshToken=${data.refreshToken}; path=/; max-age=31536000; SameSite=Lax; Secure`;
          document.cookie = `accessToken=${data.accessToken}; path=/; max-age=86400; SameSite=Lax; Secure`;
        }
        set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken, isAuthenticated: true, isLoading: false, _initialized: true });
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
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false, _initialized: true });
      },

      refresh: async () => {
        const { data } = await authApi.refresh({ ...getDeviceInfo(), refreshToken: get().refreshToken });
        if (typeof window !== 'undefined') {
          document.cookie = `accessToken=${data.accessToken}; path=/; max-age=86400; SameSite=Lax; Secure`;
        }
        set({ accessToken: data.accessToken });
      },

      fetchMe: async () => {
        if (!get()._initialized) {
          set({ isLoading: true });
        }
        try {
          let token = get().accessToken;
          if (!token) {
            const { data: refreshData } = await authApi.refresh({ ...getDeviceInfo(), refreshToken: get().refreshToken });
            token = refreshData.accessToken;
            if (typeof window !== 'undefined') {
              document.cookie = `accessToken=${token}; path=/; max-age=86400; SameSite=Lax; Secure`;
            }
            set({ accessToken: token });
          }
          const { data } = await authApi.me();
          set({ user: data, isAuthenticated: true, isLoading: false, _initialized: true });
        } catch (error: any) {
          const status = error.response?.status;
          // Only clear session if it is a client/auth error (400-499)
          if (status && status >= 400 && status < 500) {
            set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false, _initialized: true });
          } else {
            // Keep credentials on network/server errors so we don't log them out
            set({ isLoading: false, _initialized: true });
          }
        }
      },
    }),
    {
      name: 'v19-auth-web',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);
