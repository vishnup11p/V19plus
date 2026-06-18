import prisma from '../../config/db';
import redis from '../../config/redis';
import { AppError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';
import { historyEntryKey } from '../../utils/jsonArray';

interface UpsertData {
  contentId: string;
  episodeId?: string;
  progress: number;
  completed?: boolean;
}

const FLUSH_INTERVAL_MS = 30000;
const pendingFlushes = new Map<string, NodeJS.Timeout>();

async function flushToDb(userId: string, data: UpsertData) {
  const completed = data.completed ?? data.progress >= 95;
  const episodeId = data.episodeId || null;
  const entryKey = historyEntryKey(data.contentId, episodeId);

  await prisma.watchHistory.upsert({
    where: { userId_entryKey: { userId, entryKey } },
    create: {
      userId,
      contentId: data.contentId,
      episodeId,
      entryKey,
      progress: data.progress,
      completed,
    },
    update: {
      progress: data.progress,
      completed,
      updatedAt: new Date(),
    },
  });
}

export async function getHistory(userId: string) {
  const history = await prisma.watchHistory.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      content: { include: { cast: { take: 2 } } },
      episode: true,
    },
  });

  return history.map((h) => ({
    ...h,
    content: {
      ...h.content,
      genre: Array.isArray(h.content.genre) ? h.content.genre : [],
      tags: Array.isArray(h.content.tags) ? h.content.tags : [],
    },
  }));
}

export async function upsert(userId: string, data: UpsertData) {
  const content = await prisma.content.findUnique({ where: { id: data.contentId } });
  if (!content) throw new AppError('Content not found', 404);

  const bufferKey = `history:buffer:${userId}:${data.contentId}:${data.episodeId || 'movie'}`;
  await redis.set(bufferKey, JSON.stringify(data), 'EX', 120);

  const flushKey = `${userId}:${data.contentId}:${data.episodeId || 'movie'}`;
  if (!pendingFlushes.has(flushKey)) {
    const timeout = setTimeout(async () => {
      try {
        const buffered = await redis.get(bufferKey);
        if (buffered) {
          await flushToDb(userId, JSON.parse(buffered));
          await redis.del(bufferKey);
        }
      } catch (err) {
        logger.error('Failed to flush watch history:', err);
      } finally {
        pendingFlushes.delete(flushKey);
      }
    }, FLUSH_INTERVAL_MS);
    pendingFlushes.set(flushKey, timeout);
  }

  const completed = data.completed ?? data.progress >= 95;
  return { contentId: data.contentId, episodeId: data.episodeId, progress: data.progress, completed };
}

export async function getProgress(userId: string, contentId: string, episodeId?: string) {
  const entryKey = historyEntryKey(contentId, episodeId || null);
  const record = await prisma.watchHistory.findUnique({
    where: { userId_entryKey: { userId, entryKey } },
  });
  if (!record) return null;
  return { progress: record.progress, completed: record.completed, episodeId: record.episodeId };
}

export async function removeFromHistory(userId: string, contentId: string) {
  await prisma.watchHistory.deleteMany({ where: { userId, contentId } });
  return { message: 'Removed from watch history' };
}
