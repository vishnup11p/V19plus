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
