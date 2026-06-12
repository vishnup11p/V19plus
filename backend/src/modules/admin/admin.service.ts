import prisma from '../../config/db';
import { AppError } from '../../middleware/errorHandler';
import { serializeContent } from '../../utils/jsonArray';
export async function getDashboard() {
  const [users, content, categories, watchHistory] = await Promise.all([
    prisma.user.count(),
    prisma.content.count(),
    prisma.category.count(),
    prisma.watchHistory.count(),
  ]);
  return { users, content, categories, watchHistory };
}

export { getSettings, updateSettings } from '../settings/settings.service';
export { listAll as listCategories, create as createCategory, update as updateCategory, remove as removeCategory } from '../categories/categories.service';

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, email: true, name: true, role: true, avatarUrl: true, createdAt: true,
      subscription: { select: { plan: true, status: true } },
    },
  });
}

export async function updateUserRole(userId: string, role: string) {
  if (!['USER', 'ADMIN'].includes(role)) throw new AppError('Invalid role', 400);
  return prisma.user.update({ where: { id: userId }, data: { role }, select: { id: true, email: true, role: true } });
}

export async function listContent() {
  const items = await prisma.content.findMany({
    orderBy: { createdAt: 'desc' },
    include: { cast: { take: 2 }, _count: { select: { seasons: true } } },
  });
  return items.map((c) => serializeContent(c));
}

export async function createContent(data: any) {
  const genre = Array.isArray(data.genre) ? JSON.stringify(data.genre) : data.genre;
  const tags = Array.isArray(data.tags) ? JSON.stringify(data.tags || []) : (data.tags || '[]');
  return prisma.content.create({
    data: { ...data, genre, tags },
  });
}

export async function updateContent(id: string, data: any) {
  const existing = await prisma.content.findUnique({ where: { id } });
  if (!existing) throw new AppError('Content not found', 404);
  const payload = { ...data };
  if (Array.isArray(data.genre)) payload.genre = JSON.stringify(data.genre);
  if (Array.isArray(data.tags)) payload.tags = JSON.stringify(data.tags);
  return prisma.content.update({ where: { id }, data: payload });
}

export async function deleteContent(id: string) {
  const existing = await prisma.content.findUnique({ where: { id } });
  if (!existing) throw new AppError('Content not found', 404);
  await prisma.content.delete({ where: { id } });
  return { message: 'Content deleted' };
}
