import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

interface ListQuery {
  type?: string;
  genre?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class ContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private mapContent(c: any) {
    if (!c) return null;
    return {
      ...c,
      genre: c.genres ? c.genres.map((g: any) => g.genre.name) : (c.genre || []),
      genres: undefined,
    };
  }

  private mapContentList(items: any[]) {
    return items.map((item) => this.mapContent(item));
  }

  async listContent(query: ListQuery) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const where: any = { isPublished: true };
    if (query.type) {
      where.type = query.type;
    }
    if (query.genre) {
      where.genres = {
        some: {
          genre: {
            slug: query.genre.toLowerCase(),
          },
        },
      };
    }

    const items = await this.prisma.content.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        cast: { take: 3 },
        genres: { include: { genre: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await this.prisma.content.count({ where });

    return {
      items: this.mapContentList(items),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFeatured() {
    const cacheKey = 'content:featured';
    const cached = await this.redis.get<any[]>(cacheKey);
    if (cached) return cached;

    const items = await this.prisma.content.findMany({
      where: { isFeatured: true, isPublished: true },
      include: {
        cast: true,
        genres: { include: { genre: true } },
      },
      take: 5,
    });

    const mapped = this.mapContentList(items);
    await this.redis.set(cacheKey, mapped, 1800); // cache for 30m
    return mapped;
  }

  async getTrending() {
    const cacheKey = 'content:trending';
    const cached = await this.redis.get<any[]>(cacheKey);
    if (cached) return cached;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const trending = await this.prisma.watchHistory.groupBy({
      by: ['contentId'],
      where: { watchedAt: { gte: thirtyDaysAgo } },
      _count: { contentId: true },
      orderBy: { _count: { contentId: 'desc' } },
      take: 10,
    });

    const contentIds = trending.map((t) => t.contentId);
    const items = await this.prisma.content.findMany({
      where: { id: { in: contentIds }, isPublished: true },
      include: {
        cast: { take: 3 },
        genres: { include: { genre: true } },
      },
    });

    // maintain trending order
    const orderedItems = contentIds
      .map((id) => items.find((c) => c.id === id))
      .filter(Boolean) as typeof items;

    const mapped = this.mapContentList(orderedItems);
    await this.redis.set(cacheKey, mapped, 600); // cache for 10m
    return mapped;
  }

  async getOriginals() {
    const items = await this.prisma.content.findMany({
      where: { isOriginal: true, isPublished: true },
      include: {
        cast: { take: 3 },
        genres: { include: { genre: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return this.mapContentList(items);
  }

  async getContinueWatching(userId: string) {
    const history = await this.prisma.watchHistory.findMany({
      where: { userId, completed: false, progress: { gt: 0 } },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      include: {
        content: {
          include: {
            cast: { take: 2 },
            genres: { include: { genre: true } },
          },
        },
        episode: true,
      },
    });

    return history.map((h) => ({
      ...h,
      content: this.mapContent(h.content),
    }));
  }

  async getRecommended(userId: string) {
    const watched = await this.prisma.watchHistory.findMany({
      where: { userId },
      include: {
        content: {
          include: { genres: { include: { genre: true } } },
        },
      },
      take: 50,
    });

    const genreCount: Record<string, number> = {};
    watched.forEach((h) => {
      if (h.content && h.content.genres) {
        h.content.genres.forEach((g) => {
          genreCount[g.genre.name] = (genreCount[g.genre.name] || 0) + 1;
        });
      }
    });

    const topGenres = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([g]) => g);

    const watchedIds = [...new Set(watched.map((h) => h.contentId))];

    const candidates = await this.prisma.content.findMany({
      where: {
        isPublished: true,
        id: { notIn: watchedIds },
        ...(topGenres.length > 0
          ? {
              genres: {
                some: {
                  genre: {
                    name: { in: topGenres },
                  },
                },
              },
            }
          : {}),
      },
      include: {
        cast: { take: 3 },
        genres: { include: { genre: true } },
      },
      orderBy: { imdbScore: 'desc' },
      take: 20,
    });

    return this.mapContentList(candidates);
  }

  async getBySlug(slug: string, userId?: string) {
    const content = await this.prisma.content.findUnique({
      where: { slug },
      include: {
        cast: true,
        genres: { include: { genre: true } },
        subtitles: true,
        seasons: {
          orderBy: { number: 'asc' },
          include: {
            episodes: {
              orderBy: { number: 'asc' },
              include: { subtitles: true },
            },
          },
        },
      },
    });

    if (!content || !content.isPublished) {
      throw new NotFoundException('Content not found');
    }

    let watchProgress: any = null;
    if (userId) {
      const history = await this.prisma.watchHistory.findFirst({
        where: { userId, contentId: content.id },
        orderBy: { updatedAt: 'desc' },
      });
      if (history) {
        watchProgress = {
          progress: history.progress,
          completed: history.completed,
          episodeId: history.episodeId,
        };
      }
    }

    return { ...this.mapContent(content), watchProgress };
  }

  async getEpisodes(contentId: string) {
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
      include: {
        seasons: {
          orderBy: { number: 'asc' },
          include: { episodes: { orderBy: { number: 'asc' } } },
        },
      },
    });
    if (!content) throw new NotFoundException('Content not found');
    return content.seasons;
  }

  // Categories CRUD
  async listCategories() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // Watchlist
  async getWatchlist(userId: string) {
    const watchlist = await this.prisma.watchlist.findMany({
      where: { userId },
      include: {
        content: {
          include: {
            cast: { take: 2 },
            genres: { include: { genre: true } },
          },
        },
      },
      orderBy: { addedAt: 'desc' },
    });

    return watchlist.map((w) => ({
      ...w,
      content: this.mapContent(w.content),
    }));
  }

  async addToWatchlist(userId: string, contentId: string) {
    const existing = await this.prisma.watchlist.findUnique({
      where: { userId_contentId: { userId, contentId } },
    });
    if (existing) return existing;

    return this.prisma.watchlist.create({
      data: { userId, contentId },
    });
  }

  async removeFromWatchlist(userId: string, contentId: string) {
    await this.prisma.watchlist.deleteMany({
      where: { userId, contentId },
    });
    return { message: 'Removed from watchlist' };
  }


  // Admin CRUD Content
  async createContent(data: any) {
    const genres = Array.isArray(data.genre) ? data.genre : [];
    const tags = Array.isArray(data.tags) ? data.tags : [];

    const payload = { ...data };
    delete payload.genre;

    const content = await this.prisma.content.create({
      data: {
        ...payload,
        genres: {
          create: genres.map((gName: string) => ({
            genre: {
              connectOrCreate: {
                where: { name: gName },
                create: { name: gName, slug: gName.toLowerCase().replace(/[^a-z0-9]+/g, '-') },
              },
            },
          })),
        },
        tags,
      },
      include: {
        genres: { include: { genre: true } },
        cast: true,
      },
    });

    await this.redis.del('content:featured');
    await this.redis.del('content:trending');
    return this.mapContent(content);
  }

  async updateContent(id: string, data: any) {
    const existing = await this.prisma.content.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Content not found');

    const genres = data.genre;
    const tags = data.tags;

    const payload = { ...data };
    delete payload.genre;

    if (genres) {
      // Disconnect existing
      await this.prisma.contentGenre.deleteMany({ where: { contentId: id } });
      payload.genres = {
        create: genres.map((gName: string) => ({
          genre: {
            connectOrCreate: {
              where: { name: gName },
              create: { name: gName, slug: gName.toLowerCase().replace(/[^a-z0-9]+/g, '-') },
            },
          },
        })),
      };
    }

    const content = await this.prisma.content.update({
      where: { id },
      data: payload,
      include: {
        genres: { include: { genre: true } },
        cast: true,
      },
    });

    await this.redis.del('content:featured');
    await this.redis.del('content:trending');
    return this.mapContent(content);
  }

  async deleteContent(id: string) {
    const existing = await this.prisma.content.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Content not found');

    await this.prisma.content.delete({ where: { id } });
    await this.redis.del('content:featured');
    await this.redis.del('content:trending');
    return { message: 'Content deleted' };
  }
}
