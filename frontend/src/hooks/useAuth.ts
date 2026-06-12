import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

let socket: Socket | null = null;

export function useAuthInit() {
  const { fetchMe, isLoading, accessToken, isAuthenticated } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      socket?.disconnect();
      socket = null;
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
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

  return { isLoading };
}

export function useAuth() {
  return useAuthStore();
}
