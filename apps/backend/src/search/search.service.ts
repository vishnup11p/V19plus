import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private mapContent(c: any) {
    if (!c) return null;
    return {
      ...c,
      genre: c.genres ? c.genres.map((g: any) => g.genre.name) : (c.genre ?? []),
      genres: undefined,
    };
  }

  async search(rawQuery: string) {
    const q = rawQuery.trim();
    if (!q || q.length < 2) {
      return { results: [], query: q, total: 0 };
    }

    // Cache full search results for 2 minutes
    const cacheKey = `search:results:${q.toLowerCase()}`;
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

    const items = await this.prisma.content.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { cast: { some: { name: { contains: q, mode: 'insensitive' } } } },
          { genres: { some: { genre: { name: { contains: q, mode: 'insensitive' } } } } },
        ],
      },
      include: {
        cast: { take: 3 },
        genres: { include: { genre: true } },
      },
      orderBy: [{ imdbScore: 'desc' }, { releaseYear: 'desc' }],
      take: 40,
    });

    const results = items.map((item) => this.mapContent(item));
    const response = { results, query: q, total: results.length };

    await this.redis.set(cacheKey, response, 120);
    return response;
  }

  async suggestions(rawQuery: string) {
    const q = rawQuery.trim().toLowerCase();
    if (!q || q.length < 1) return [];

    const cacheKey = `search:suggestions:${q}`;
    const cached = await this.redis.get<any[]>(cacheKey);
    if (cached) return cached;

    // Pull only the fields we need, include genre names for tag matching
    const contents = await this.prisma.content.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { genres: { some: { genre: { name: { contains: q, mode: 'insensitive' } } } } },
        ],
      },
      select: {
        title: true,
        slug: true,
        thumbnailUrl: true,
        type: true,
        releaseYear: true,
      },
      orderBy: { releaseYear: 'desc' },
      take: 8,
    });

    const suggestions = contents.map((c) => ({
      title: c.title,
      slug: c.slug,
      thumbnailUrl: c.thumbnailUrl,
      type: c.type,
      releaseYear: c.releaseYear,
    }));

    await this.redis.set(cacheKey, suggestions, 300);
    return suggestions;
  }
}
