import prisma from '../../config/db';
import { cacheGet, cacheSet } from '../../config/redis';
import { AppError } from '../../middleware/errorHandler';
import {
  asStringArray,
  contentMatchesGenre,
  contentMatchesGenres,
  serializeContent,
} from '../../utils/jsonArray';

interface ListQuery {
  type?: string;
  genre?: string;
  page?: number;
  limit?: number;
}

function withSerializedGenreTags<T extends { genre: unknown; tags: unknown }>(items: T[]) {
  return items.map(serializeContent);
}

export async function listContent(query: ListQuery) {
  const page = query.page || 1;
  const limit = query.limit || 20;

  let items = await prisma.content.findMany({
    where: { isPublished: true, ...(query.type ? { type: query.type } : {}) },
    orderBy: { createdAt: 'desc' },
    include: { cast: { take: 3 } },
  });

  if (query.genre) {
    items = items.filter((item) => contentMatchesGenre(item.genre, query.genre!));
  }

  const total = items.length;
  const skip = (page - 1) * limit;
  const paged = items.slice(skip, skip + limit);

  return { items: withSerializedGenreTags(paged), total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getFeatured() {
  const cacheKey = 'content:featured';
  const cached = await cacheGet<any>(cacheKey);
  if (cached) return cached;

  const items = withSerializedGenreTags(await prisma.content.findMany({
    where: { isFeatured: true, isPublished: true },
    include: { cast: true },
    take: 5,
  }));

  await cacheSet(cacheKey, items, 1800);
  return items;
}

export async function getTrending() {
  const cacheKey = 'content:trending';
  const cached = await cacheGet<any>(cacheKey);
  if (cached) return cached;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const trending = await prisma.watchHistory.groupBy({
    by: ['contentId'],
    where: { watchedAt: { gte: thirtyDaysAgo } },
    _count: { contentId: true },
    orderBy: { _count: { contentId: 'desc' } },
    take: 10,
  });

  const contentIds = trending.map((t) => t.contentId);
  const items = await prisma.content.findMany({
    where: { id: { in: contentIds }, isPublished: true },
    include: { cast: { take: 3 } },
  });

  const sorted = withSerializedGenreTags(
    contentIds.map((id) => items.find((c) => c.id === id)).filter(Boolean) as typeof items
  );

  await cacheSet(cacheKey, sorted, 600);
  return sorted;
}

export async function getOriginals() {
  const items = await prisma.content.findMany({
    where: { isOriginal: true, isPublished: true },
    include: { cast: { take: 3 } },
    orderBy: { createdAt: 'desc' },
  });
  return withSerializedGenreTags(items);
}

export async function getContinueWatching(userId: string) {
  const history = await prisma.watchHistory.findMany({
    where: { userId, completed: false, progress: { gt: 0 } },
    orderBy: { updatedAt: 'desc' },
    take: 10,
    include: {
      content: { include: { cast: { take: 2 } } },
      episode: true,
    },
  });

  return history.map((h) => ({
    ...h,
    content: serializeContent(h.content),
  }));
}

export async function getRecommended(userId: string) {
  const watched = await prisma.watchHistory.findMany({
    where: { userId },
    include: { content: { select: { genre: true } } },
    take: 50,
  });

  const genreCount: Record<string, number> = {};
  watched.forEach((h) => {
    asStringArray(h.content.genre).forEach((g) => {
      genreCount[g] = (genreCount[g] || 0) + 1;
    });
  });

  const topGenres = Object.entries(genreCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([g]) => g);

  const watchedIds = [...new Set(watched.map((h) => h.contentId))];

  let candidates = await prisma.content.findMany({
    where: { isPublished: true, id: { notIn: watchedIds } },
    include: { cast: { take: 3 } },
    orderBy: { imdbScore: 'desc' },
    take: 60,
  });

  if (topGenres.length > 0) {
    const matched = candidates.filter((c) => contentMatchesGenres(c.genre, topGenres));
    if (matched.length > 0) candidates = matched;
  }

  return withSerializedGenreTags(candidates.slice(0, 20));
}

export async function getBySlug(slug: string, userId?: string) {
  const content = await prisma.content.findUnique({
    where: { slug },
    include: {
      cast: true,
      seasons: {
        orderBy: { number: 'asc' },
        include: { episodes: { orderBy: { number: 'asc' } } },
      },
    },
  });

  if (!content || !content.isPublished) {
    throw new AppError('Content not found', 404);
  }

  let watchProgress = null;
  if (userId) {
    const history = await prisma.watchHistory.findFirst({
      where: { userId, contentId: content.id },
      orderBy: { updatedAt: 'desc' },
    });
    if (history) {
      watchProgress = { progress: history.progress, completed: history.completed, episodeId: history.episodeId };
    }
  }

  return { ...serializeContent(content), watchProgress };
}

export async function getEpisodes(contentId: string) {
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    include: {
      seasons: {
        orderBy: { number: 'asc' },
        include: { episodes: { orderBy: { number: 'asc' } } },
      },
    },
  });
  if (!content) throw new AppError('Content not found', 404);
  return content.seasons;
}

export async function createContent(data: any) {
  const content = await prisma.content.create({ data, include: { cast: true } });
  return serializeContent(content);
}

export async function updateContent(id: string, data: any) {
  const existing = await prisma.content.findUnique({ where: { id } });
  if (!existing) throw new AppError('Content not found', 404);
  const content = await prisma.content.update({ where: { id }, data, include: { cast: true } });
  return serializeContent(content);
}

export async function deleteContent(id: string) {
  const existing = await prisma.content.findUnique({ where: { id } });
  if (!existing) throw new AppError('Content not found', 404);
  await prisma.content.delete({ where: { id } });
  return { message: 'Content deleted' };
}
