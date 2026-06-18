import { Response, Request } from 'express';
import prisma from '../../config/db';
import { cacheGet, cacheSet } from '../../config/redis';
import { asStringArray, contentMatchesTag, serializeContent } from '../../utils/jsonArray';

export async function search(req: Request, res: Response) {
  const q = (req.query.q as string || '').trim();
  if (!q || q.length < 2) {
    res.json({ results: [], query: q });
    return;
  }

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
