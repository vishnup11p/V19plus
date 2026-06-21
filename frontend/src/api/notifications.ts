import api from './axios';

export interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  transactionId: string;
  createdAt: string;
}

export const notificationApi = {
  list: () => api.get<Notification[]>('/user/notifications'),
  unreadCount: () => api.get<{ count: number }>('/user/notifications/unread-count'),
  markRead: (id: string) => api.patch(`/user/notifications/${id}/read`),
  markAllRead: () => api.post('/user/notifications/read-all'),
};

export const paymentApi = {
  list: () => api.get<Payment[]>('/user/payments'),
};
