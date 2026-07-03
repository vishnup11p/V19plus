import {
  Injectable,
  NotFoundException,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { UpsertHistoryDto } from './dto/upsert-history.dto';

/** Write progress to DB at most once every 30 s per viewing session */
const FLUSH_INTERVAL_MS = 30_000;

@Injectable()
export class StreamingService implements OnModuleDestroy {
  private readonly logger = new Logger(StreamingService.name);
  private readonly pendingFlushes = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private entryKey(contentId: string, episodeId?: string | null): string {
    return episodeId ? `${contentId}:${episodeId}` : contentId;
  }

  private bufferKey(userId: string, contentId: string, episodeId?: string): string {
    return `history:buffer:${userId}:${contentId}:${episodeId ?? 'movie'}`;
  }

  private flushKey(userId: string, contentId: string, episodeId?: string): string {
    return `${userId}:${contentId}:${episodeId ?? 'movie'}`;
  }

  // ─── Buffered write ───────────────────────────────────────────────────────

  /** Flush the buffered progress entry directly to Postgres */
  async flushToDb(userId: string, data: UpsertHistoryDto): Promise<void> {
    const completed = data.completed ?? data.progress >= 95;
    const episodeId = data.episodeId ?? null;
    const key = this.entryKey(data.contentId, episodeId);

    await this.prisma.watchHistory.upsert({
      where: { userId_entryKey: { userId, entryKey: key } },
      create: {
        userId,
        contentId: data.contentId,
        episodeId,
        entryKey: key,
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

  // ─── Public API ───────────────────────────────────────────────────────────

  async upsert(userId: string, data: UpsertHistoryDto) {
    // Validate content exists
    const exists = await this.prisma.content.findUnique({
      where: { id: data.contentId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Content not found');

    // Write to Redis buffer
    const bKey = this.bufferKey(userId, data.contentId, data.episodeId);
    await this.redis.set(bKey, data, 120);

    // Debounce DB write
    const fKey = this.flushKey(userId, data.contentId, data.episodeId);
    if (!this.pendingFlushes.has(fKey)) {
      const timeout = setTimeout(async () => {
        try {
          const buffered = await this.redis.get<UpsertHistoryDto>(bKey);
          if (buffered) {
            await this.flushToDb(userId, buffered);
            await this.redis.del(bKey);
          }
        } catch (err) {
          this.logger.error('Failed to flush watch history to DB:', err);
        } finally {
          this.pendingFlushes.delete(fKey);
        }
      }, FLUSH_INTERVAL_MS);
      this.pendingFlushes.set(fKey, timeout);
    }

    // Return optimistic response immediately
    return {
      contentId: data.contentId,
      episodeId: data.episodeId,
      progress: data.progress,
      completed: data.completed ?? data.progress >= 95,
    };
  }

  async getHistory(userId: string) {
    const history = await this.prisma.watchHistory.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 100,
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
      content: {
        ...h.content,
        genre: h.content
          ? (h.content as any).genres?.map((g: any) => g.genre.name) ?? []
          : [],
        genres: undefined,
      },
    }));
  }

  async getProgress(userId: string, contentId: string, episodeId?: string) {
    // Check the Redis buffer first for the very latest value
    const bKey = this.bufferKey(userId, contentId, episodeId);
    const buffered = await this.redis.get<UpsertHistoryDto>(bKey);
    if (buffered) {
      return {
        progress: buffered.progress,
        completed: buffered.completed ?? buffered.progress >= 95,
        episodeId: buffered.episodeId,
      };
    }

    const key = this.entryKey(contentId, episodeId ?? null);
    const record = await this.prisma.watchHistory.findUnique({
      where: { userId_entryKey: { userId, entryKey: key } },
    });
    if (!record) return null;

    return {
      progress: record.progress,
      completed: record.completed,
      episodeId: record.episodeId,
    };
  }

  async removeFromHistory(userId: string, contentId: string) {
    // Also clear any pending buffer entries for this content
    const bKeyMovie = this.bufferKey(userId, contentId);
    await this.redis.del(bKeyMovie);
    await this.redis.delPattern(this.bufferKey(userId, contentId, '*'));

    await this.prisma.watchHistory.deleteMany({ where: { userId, contentId } });
    return { message: 'Removed from watch history' };
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  onModuleDestroy() {
    // Flush all pending timers immediately on shutdown
    for (const timeout of this.pendingFlushes.values()) {
      clearTimeout(timeout);
    }
    this.pendingFlushes.clear();
  }
}
