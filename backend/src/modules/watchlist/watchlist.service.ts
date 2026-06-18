import prisma from '../../config/db';
import { AppError } from '../../middleware/errorHandler';

export async function getWatchlist(userId: string) {
  const items = await prisma.watchlist.findMany({
    where: { userId },
    orderBy: { addedAt: 'desc' },
    include: {
      content: { include: { cast: { take: 3 } } },
    },
  });
  return items;
}

export async function addToWatchlist(userId: string, contentId: string) {
  const content = await prisma.content.findUnique({ where: { id: contentId } });
  if (!content) throw new AppError('Content not found', 404);

  const existing = await prisma.watchlist.findUnique({
    where: { userId_contentId: { userId, contentId } },
  });
  if (existing) return existing;

  return prisma.watchlist.create({
    data: { userId, contentId },
    include: { content: true },
  });
}

export async function removeFromWatchlist(userId: string, contentId: string) {
  await prisma.watchlist.deleteMany({ where: { userId, contentId } });
  return { message: 'Removed from watchlist' };
}
