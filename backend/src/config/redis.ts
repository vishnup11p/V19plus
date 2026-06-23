import Redis from 'ioredis';
import { logger } from '../utils/logger';

const USE_MEMORY = (process.env.REDIS_URL || '').startsWith('memory://');

class MemoryRedis {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  private purgeExpired(key: string) {
    const entry = this.store.get(key);
    if (entry?.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
    }
  }

  async get(key: string): Promise<string | null> {
    this.purgeExpired(key);
    return this.store.get(key)?.value ?? null;
  }

  async set(key: string, value: string, mode?: string, ttl?: number): Promise<'OK'> {
    const expiresAt = mode === 'EX' && ttl ? Date.now() + ttl * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let count = 0;
    keys.forEach((k) => { if (this.store.delete(k)) count++; });
    return count;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return [...this.store.keys()].filter((k) => regex.test(k));
  }

  on() { return this; }
}

const redis: Redis | MemoryRedis = USE_MEMORY
  ? (logger.info('📦 Using in-memory Redis (local dev)'), new MemoryRedis())
  : new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 50, 2000);
      },
    });

if (!USE_MEMORY && redis instanceof Redis) {
  redis.connect().catch(() => logger.warn('⚠️ Redis unavailable — caching disabled'));
  redis.on('connect', () => logger.info('✅ Redis connected'));
  redis.on('error', (err) => logger.error('❌ Redis error:', err));
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number = 600): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // ignore cache write failures
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch {
    // ignore
  }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  } catch {
    // ignore
  }
}

export default redis;
