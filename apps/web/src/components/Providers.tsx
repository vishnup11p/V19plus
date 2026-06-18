'use client';

import React, { useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

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
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isSubscribed = true;
    let listenerHandle: { remove: () => void } | null = null;

    const initCapacitor = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!isSubscribed || !Capacitor.isNativePlatform()) return;

        const { App } = await import('@capacitor/app');
        
        const handle = await App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            App.exitApp();
          }
        });

        if (!isSubscribed) {
          handle.remove();
        } else {
          listenerHandle = handle;
        }
      } catch (err) {
        console.error('Failed to initialize Capacitor native back button:', err);
      }
    };

    initCapacitor();

    return () => {
      isSubscribed = false;
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
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
