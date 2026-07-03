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
  profileId?: string;
}

function withSerializedGenreTags<T extends { genre: unknown; tags: unknown }>(items: T[]) {
  return items.map(serializeContent);
}

async function getProfileFilter(profileId?: string) {
  if (!profileId) return {};
  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (profile?.isKids) {
    return { rating: { in: ['G', 'PG', 'U', 'U/A 7+'] } };
  }
  return {};
}

export async function listContent(query: ListQuery) {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const ratingFilter = await getProfileFilter(query.profileId);

  let items = await prisma.content.findMany({
    where: { isPublished: true, ...ratingFilter, ...(query.type ? { type: query.type } : {}) },
    orderBy: { createdAt: 'desc' },
    include: { cast: { take: 3 } },
  });

  if (query.genre) {
    items = items.filter((item: any) => contentMatchesGenre(item.genre, query.genre!));
  }

  const total = items.length;
  const skip = (page - 1) * limit;
  const paged = items.slice(skip, skip + limit);

  return { items: withSerializedGenreTags(paged), total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getFeatured(profileId?: string) {
  const ratingFilter = await getProfileFilter(profileId);
  const isKids = Object.keys(ratingFilter).length > 0;
  const cacheKey = `content:featured:${isKids ? 'kids' : 'all'}`;
  const cached = await cacheGet<any>(cacheKey);
  if (cached) return cached;

  const items = withSerializedGenreTags(await prisma.content.findMany({
    where: { isFeatured: true, isPublished: true, ...ratingFilter },
    include: { cast: true },
    take: 5,
  }));

  await cacheSet(cacheKey, items, 1800);
  return items;
}

export async function getTrending(profileId?: string) {
  const ratingFilter = await getProfileFilter(profileId);
  const isKids = Object.keys(ratingFilter).length > 0;
  const cacheKey = `content:trending:${isKids ? 'kids' : 'all'}`;
  const cached = await cacheGet<any>(cacheKey);
  if (cached) return cached;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const trending = await prisma.watchHistory.groupBy({
    by: ['contentId'],
    where: { watchedAt: { gte: thirtyDaysAgo } },
    _count: { contentId: true },
    orderBy: { _count: { contentId: 'desc' } },
    take: 50, // Fetch more to allow filtering
  });

  const contentIds = trending.map((t: any) => t.contentId);
  const items = await prisma.content.findMany({
    where: { id: { in: contentIds }, isPublished: true, ...ratingFilter },
    include: { cast: { take: 3 } },
  });

  const sorted = withSerializedGenreTags(
    contentIds.map((id: any) => items.find((c: any) => c.id === id)).filter(Boolean) as typeof items
  ).slice(0, 10);

  await cacheSet(cacheKey, sorted, 600);
  return sorted;
}

export async function getOriginals(profileId?: string) {
  const ratingFilter = await getProfileFilter(profileId);
  const items = await prisma.content.findMany({
    where: { isOriginal: true, isPublished: true, ...ratingFilter },
    include: { cast: { take: 3 } },
    orderBy: { createdAt: 'desc' },
  });
  return withSerializedGenreTags(items);
}

export async function getNewReleases(profileId?: string) {
  const ratingFilter = await getProfileFilter(profileId);
  const isKids = Object.keys(ratingFilter).length > 0;
  const cacheKey = `content:new-releases:${isKids ? 'kids' : 'all'}`;
  const cached = await cacheGet<any>(cacheKey);
  if (cached) return cached;

  const items = await prisma.content.findMany({
    where: { isPublished: true, ...ratingFilter },
    include: { cast: { take: 3 } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const result = withSerializedGenreTags(items);
  await cacheSet(cacheKey, result, 3600);
  return result;
}

export async function getContinueWatching(userId: string, profileId?: string) {
  const history = await prisma.watchHistory.findMany({
    where: { userId, ...(profileId ? { profileId } : {}), completed: false, progress: { gt: 0 } },
    orderBy: { updatedAt: 'desc' },
    take: 10,
    include: {
      content: { include: { cast: { take: 2 } } },
      episode: true,
    },
  });

  return history.map((h: any) => ({
    ...h,
    content: serializeContent(h.content),
  }));
}

export async function getRecommended(userId: string, profileId?: string) {
  const ratingFilter = await getProfileFilter(profileId);
  const watched = await prisma.watchHistory.findMany({
    where: { userId, ...(profileId ? { profileId } : {}) },
    include: { content: { select: { genre: true } } },
    take: 50,
  });

  const genreCount: Record<string, number> = {};
  watched.forEach((h: any) => {
    asStringArray(h.content.genre).forEach((g) => {
      genreCount[g] = (genreCount[g] || 0) + 1;
    });
  });

  const topGenres = Object.entries(genreCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([g]) => g);

  const watchedIds = [...new Set(watched.map((h: any) => h.contentId))];

  let candidates = await prisma.content.findMany({
    where: { isPublished: true, id: { notIn: watchedIds }, ...ratingFilter },
    include: { cast: { take: 3 } },
    orderBy: { imdbScore: 'desc' },
    take: 60,
  });

  if (topGenres.length > 0) {
    const matched = candidates.filter((c: any) => contentMatchesGenres(c.genre, topGenres));
    if (matched.length > 0) candidates = matched;
  }

  return withSerializedGenreTags(candidates.slice(0, 20));
}

// T2-1: "Because You Watched X" — per-title affinity rows
export async function getBecauseYouWatched(userId: string, profileId?: string) {
  const ratingFilter = await getProfileFilter(profileId);
  // Get user's 3 most recently watched distinct titles
  const recentHistory = await prisma.watchHistory.findMany({
    where: { userId, ...(profileId ? { profileId } : {}) },
    orderBy: { updatedAt: 'desc' },
    take: 20,
    include: { content: { select: { id: true, title: true, genre: true, tags: true } } },
  });

  const seen = new Set<string>();
  const seedTitles: { id: string; title: string; genre: any; tags: any }[] = [];
  for (const h of recentHistory as any[]) {
    if (!seen.has(h.contentId)) {
      seen.add(h.contentId);
      seedTitles.push(h.content);
      if (seedTitles.length >= 3) break;
    }
  }

  if (seedTitles.length === 0) return [];

  const watchedIds = [...seen];
  const allContent = await prisma.content.findMany({
    where: { isPublished: true, id: { notIn: watchedIds }, ...ratingFilter },
    include: { cast: { take: 2 } },
    take: 200,
  });

  const rows = seedTitles.map((seed) => {
    const seedGenres = asStringArray(seed.genre);
    const seedTags = asStringArray(seed.tags);

    const scored = (allContent as any[]).map((c) => {
      const genres = asStringArray(c.genre);
      const tags = asStringArray(c.tags);
      const genreOverlap = genres.filter((g: string) => seedGenres.includes(g)).length;
      const tagOverlap = tags.filter((t: string) => seedTags.includes(t)).length;
      return { ...c, _score: genreOverlap * 2 + tagOverlap };
    });

    const similar = scored
      .filter((c) => c._score > 0)
      .sort((a, b) => b._score - a._score || (b.imdbScore || 0) - (a.imdbScore || 0))
      .slice(0, 15);

    if (similar.length < 3) return null;

    return {
      seedTitle: seed.title,
      seedId: seed.id,
      items: withSerializedGenreTags(similar),
    };
  });

  return rows.filter(Boolean);
}

// T2-9: "More Like This"
export async function getSimilar(contentId: string, profileId?: string) {
  const ratingFilter = await getProfileFilter(profileId);
  const source = await prisma.content.findUnique({
    where: { id: contentId },
    select: { genre: true, tags: true, type: true },
  });
  if (!source) return [];

  const sourceGenres = asStringArray(source.genre);
  const sourceTags = asStringArray(source.tags);

  const candidates = await prisma.content.findMany({
    where: { isPublished: true, id: { not: contentId }, ...ratingFilter },
    include: { cast: { take: 2 } },
    take: 100,
  });

  const scored = (candidates as any[]).map((c) => {
    const genres = asStringArray(c.genre);
    const tags = asStringArray(c.tags);
    const genreOverlap = genres.filter((g: string) => sourceGenres.includes(g)).length;
    const tagOverlap = tags.filter((t: string) => sourceTags.includes(t)).length;
    const sameType = c.type === source.type ? 1 : 0;
    return { ...c, _score: genreOverlap * 2 + tagOverlap + sameType };
  });

  const similar = scored
    .filter((c) => c._score > 0)
    .sort((a, b) => b._score - a._score || (b.imdbScore || 0) - (a.imdbScore || 0))
    .slice(0, 20);

  return withSerializedGenreTags(similar);
}

// T2-3: Match score — compute per-user affinity % for a list of content IDs
export async function getMatchScores(userId: string, profileId: string | undefined, contentIds: string[]) {
  if (contentIds.length === 0) return {};

  const watched = await prisma.watchHistory.findMany({
    where: { userId, ...(profileId ? { profileId } : {}) },
    include: { content: { select: { genre: true } } },
    take: 100,
  });

  const genreCount: Record<string, number> = {};
  let totalWatched = 0;
  watched.forEach((h: any) => {
    asStringArray(h.content.genre).forEach((g) => {
      genreCount[g] = (genreCount[g] || 0) + 1;
      totalWatched++;
    });
  });

  if (totalWatched === 0) return {};

  const contents = await prisma.content.findMany({
    where: { id: { in: contentIds } },
    select: { id: true, genre: true, imdbScore: true },
  });

  const scores: Record<string, number> = {};
  for (const c of contents as any[]) {
    const genres = asStringArray(c.genre);
    if (genres.length === 0) { scores[c.id] = 70; continue; }
    const affinity = genres.reduce((sum: number, g: string) => sum + (genreCount[g] || 0), 0);
    const maxPossible = Math.max(...Object.values(genreCount)) * genres.length;
    const rawScore = maxPossible > 0 ? (affinity / maxPossible) * 100 : 50;
    // Blend with IMDB score to avoid too-low scores for great content
    const imdbBoost = ((c.imdbScore || 7) / 10) * 20;
    scores[c.id] = Math.min(99, Math.round(rawScore * 0.7 + imdbBoost + 40));
  }

  return scores;
}

export async function getBySlug(slug: string, userId?: string, profileId?: string) {
  const ratingFilter = await getProfileFilter(profileId);
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

  // Double check if rating filter applies here to block access
  if (ratingFilter.rating && !ratingFilter.rating.in.includes(content.rating)) {
    throw new AppError('Content not allowed for this profile', 403);
  }

  let watchProgress = null;
  if (userId) {
    const history = await prisma.watchHistory.findFirst({
      where: { userId, contentId: content.id, ...(profileId ? { profileId } : {}) },
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
  const genre = Array.isArray(data.genre) ? JSON.stringify(data.genre) : data.genre;
  const tags = Array.isArray(data.tags) ? data.tags : [];
  const content = await prisma.content.create({
    data: { ...data, genre, tags },
    include: { cast: true },
  });
  return serializeContent(content);
}

export async function updateContent(id: string, data: any) {
  const existing = await prisma.content.findUnique({ where: { id } });
  if (!existing) throw new AppError('Content not found', 404);
  const payload = { ...data };
  if (Array.isArray(data.genre)) payload.genre = JSON.stringify(data.genre);
  if (Array.isArray(data.tags)) payload.tags = data.tags;
  const content = await prisma.content.update({
    where: { id },
    data: payload,
    include: { cast: true },
  });
  return serializeContent(content);
}

export async function deleteContent(id: string) {
  const existing = await prisma.content.findUnique({ where: { id } });
  if (!existing) throw new AppError('Content not found', 404);
  await prisma.content.delete({ where: { id } });
  return { message: 'Content deleted' };
}
