'use client';

import React, { useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useDownloadStore } from '../store/downloadStore';

let socket: Socket | null = null;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthInit({ children }: { children: React.ReactNode }) {
  const { fetchMe, accessToken, isAuthenticated } = useAuthStore();
  const initRef = useRef(false);

  // Attempt to restore session exactly ONCE on mount
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    fetchMe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Socket.IO connection management
  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      socket?.disconnect();
      socket = null;
      return;
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
    socket = io(socketUrl, {
      auth: { token: accessToken },
    });

    socket.on('notification', (data: { message: string }) => {
      toast(data.message, { icon: '🎬' });
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [isAuthenticated, accessToken]);

  return <>{children}</>;
}

function CapacitorNativeInit() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isSubscribed = true;
    const activeHandles: any[] = [];

    const initCapacitor = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!isSubscribed || !Capacitor.isNativePlatform()) return;

        const { App } = await import('@capacitor/app');
        const { PushNotifications } = await import('@capacitor/push-notifications');
        
        // 1. Back button handling
        const backHandle = await App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            App.exitApp();
          }
        });
        activeHandles.push(backHandle);

        // 2. Deep linking (URL handling)
        const urlHandle = await App.addListener('appUrlOpen', (data) => {
          try {
            let targetPath = '';
            if (data.url.startsWith('v19plus://')) {
              targetPath = data.url.replace('v19plus://', '/');
            } else {
              const url = new URL(data.url);
              targetPath = url.pathname + url.search;
            }
            if (targetPath && isSubscribed) {
              router.push(targetPath);
            }
          } catch (e) {
            console.error('Failed to parse deep link URL:', data.url, e);
          }
        });
        activeHandles.push(urlHandle);

        // 3. Push notifications
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive === 'granted') {
          await PushNotifications.register();
        }

        const pushRegHandle = await PushNotifications.addListener('registration', (token) => {
          console.log('Push registration success, token:', token.value);
        });
        activeHandles.push(pushRegHandle);

        const pushErrHandle = await PushNotifications.addListener('registrationError', (error) => {
          console.error('Push registration error:', error);
        });
        activeHandles.push(pushErrHandle);

        const pushRecHandle = await PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push notification received:', notification);
          toast(notification.body || notification.title || 'New Notification', { icon: '🔔' });
        });
        activeHandles.push(pushRecHandle);

        const pushActHandle = await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          console.log('Push notification clicked:', action);
          const data = action.notification.data;
          if (data && data.route && isSubscribed) {
            router.push(data.route);
          }
        });
        activeHandles.push(pushActHandle);

        // If unmounted during async init, clean up immediately
        if (!isSubscribed) {
          activeHandles.forEach((h) => h.remove());
        }
      } catch (err) {
        console.error('Failed to initialize Capacitor native listeners:', err);
      }
    };

    initCapacitor();

    return () => {
      isSubscribed = false;
      activeHandles.forEach((h) => h.remove());
    };
  }, [router]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const initDownloads = useDownloadStore((state) => state.initDownloads);

  useEffect(() => {
    initDownloads();
  }, [initDownloads]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthInit>
        <CapacitorNativeInit />
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1A1A1A',
              color: '#F5F5F0',
              border: '1px solid #2A2A28',
            },
          }}
        />
      </AuthInit>
    </QueryClientProvider>
  );
}
