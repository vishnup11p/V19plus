import prisma from '../../config/db';
import { AppError } from '../../middleware/errorHandler';

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, name: true, avatarUrl: true, role: true,
      isVerified: true, createdAt: true,
      subscription: { select: { plan: true, status: true, currentPeriodEnd: true } },
    },
  });
  if (!user) throw new AppError('User not found', 404);
  return user;
}

export async function updateProfile(userId: string, data: { name?: string; avatarUrl?: string }) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, email: true, name: true, avatarUrl: true },
  });
}

export async function listProfiles(userId: string) {
  return prisma.profile.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
}

export async function createProfile(userId: string, data: { name: string; avatarColor?: string; isKids?: boolean; pin?: string }) {
  const count = await prisma.profile.count({ where: { userId } });
  if (count >= 5) throw new AppError('Maximum 5 profiles allowed', 400);

  return prisma.profile.create({
    data: { userId, ...data },
  });
}

export async function deleteProfile(userId: string, profileId: string) {
  const profile = await prisma.profile.findFirst({ where: { id: profileId, userId } });
  if (!profile) throw new AppError('Profile not found', 404);
  await prisma.profile.delete({ where: { id: profileId } });
  return { message: 'Profile deleted' };
}

// T1-6: Payment history
export async function getPayments(userId: string) {
  return prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
}

// T1-7: Notifications
export async function getNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const notif = await prisma.notification.findFirst({ where: { id: notificationId, userId } });
  if (!notif) throw new AppError('Notification not found', 404);
  return prisma.notification.update({ where: { id: notificationId }, data: { isRead: true } });
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  return { message: 'All notifications marked as read' };
}

export async function getUnreadNotificationCount(userId: string) {
  const count = await prisma.notification.count({ where: { userId, isRead: false } });
  return { count };
}
