import { Response, Request } from 'express';
import prisma from '../../config/db';
import { cacheGet, cacheSet } from '../../config/redis';
import { asStringArray, contentMatchesTag, serializeContent } from '../../utils/jsonArray';

// T2-7: Trending searches (migrated to Redis)
const TRENDING_CACHE_KEY = 'search:trending_queries';
const MAX_TRENDING = 10;

async function trackQuery(q: string) {
  const key = q.toLowerCase().trim();
  if (key.length < 2) return;

  const mapData = await cacheGet<Record<string, number>>(TRENDING_CACHE_KEY) || {};
  mapData[key] = (mapData[key] || 0) + 1;

  if (Object.keys(mapData).length > 500) {
    const sorted = Object.entries(mapData).sort((a, b) => b[1] - a[1]);
    const pruned: Record<string, number> = {};
    sorted.slice(0, 200).forEach(([k, v]) => { pruned[k] = v; });
    await cacheSet(TRENDING_CACHE_KEY, pruned, 86400 * 7); // 7 days
  } else {
    await cacheSet(TRENDING_CACHE_KEY, mapData, 86400 * 7);
  }
}

export async function search(req: Request, res: Response) {
  const q = (req.query.q as string || '').trim();
  if (!q || q.length < 2) {
    res.json({ results: [], query: q });
    return;
  }

  // Track for trending
  await trackQuery(q);

  const ql = q.toLowerCase();
  const candidates = await prisma.content.findMany({
    where: {
      isPublished: true,
      OR: [
        { title: { contains: q } },
        { description: { contains: q } },
        { cast: { some: { name: { contains: q } } } },
      ],
    },
    include: { cast: { take: 3 } },
    take: 60,
    orderBy: { imdbScore: 'desc' },
  });

  const results = candidates
    .filter((item) => {
      const genres = asStringArray(item.genre);
      const tags = asStringArray(item.tags);
      return (
        item.title.toLowerCase().includes(ql) ||
        item.description.toLowerCase().includes(ql) ||
        genres.some((g) => g.toLowerCase().includes(ql)) ||
        tags.some((t) => t.toLowerCase().includes(ql)) ||
        item.cast.some((c) => c.name.toLowerCase().includes(ql))
      );
    })
    .slice(0, 30)
    .map(serializeContent);

  res.json({ results, query: q, total: results.length });
}

export async function suggestions(req: Request, res: Response) {
  const q = (req.query.q as string || '').trim().toLowerCase();
  if (!q || q.length < 1) {
    res.json([]);
    return;
  }

  const cacheKey = `search:suggestions:${q}`;
  const cached = await cacheGet<any[]>(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  const contents = await prisma.content.findMany({
    where: { isPublished: true },
    select: { title: true, slug: true, thumbnailUrl: true, type: true, tags: true },
    take: 40,
  });

  const suggestions = contents
    .filter((c) => c.title.toLowerCase().includes(q) || contentMatchesTag(c.tags, q))
    .slice(0, 8)
    .map((c) => ({
      title: c.title,
      slug: c.slug,
      thumbnailUrl: c.thumbnailUrl,
      type: c.type,
    }));

  await cacheSet(cacheKey, suggestions, 300);
  res.json(suggestions);
}

// T2-7: Trending searches
export async function trendingSearches(_req: Request, res: Response) {
  const mapData = await cacheGet<Record<string, number>>(TRENDING_CACHE_KEY) || {};
  const sorted = Object.entries(mapData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_TRENDING)
    .map(([q]) => q);
  res.json(sorted);
}

// T2-8: Person / actor filmography page
export async function personSearch(req: Request, res: Response) {
  const name = decodeURIComponent(req.params.name || '').trim();
  if (!name) { res.json({ person: null, items: [] }); return; }

  const castMembers = await prisma.castMember.findMany({
    where: { name: { contains: name } },
    include: {
      content: {
        include: { cast: { take: 3 } },
      },
    },
    take: 50,
  });

  if (castMembers.length === 0) { res.json({ person: null, items: [] }); return; }

  // Canonical person info from first match
  const person = {
    name: castMembers[0].name,
    photoUrl: castMembers[0].photoUrl,
    roles: [...new Set(castMembers.map((m) => m.role))],
  };

  // Deduplicate content
  const seen = new Set<string>();
  const items = castMembers
    .map((m) => m.content)
    .filter((c) => { if (seen.has(c.id)) return false; seen.add(c.id); return c.isPublished; })
    .map(serializeContent);

  res.json({ person, items });
}
