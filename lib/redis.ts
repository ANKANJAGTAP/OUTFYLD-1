import { Redis } from '@upstash/redis';

// ─── Redis Client ────────────────────────────────────────────
// Uses Upstash Redis (serverless, Vercel-integrated).
// Falls back gracefully if env vars are not set — the app works
// without Redis, just slower (no caching layer).

let redis: Redis | null = null;
let redisWarningShown = false;

function getRedisClient(): Redis | null {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (!redisWarningShown) {
      console.log('⚠️ Redis: UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set. Caching disabled.');
      redisWarningShown = true;
    }
    return null;
  }

  try {
    redis = new Redis({ url, token });
    return redis;
  } catch (error) {
    console.error('Failed to initialize Redis:', error);
    return null;
  }
}

/**
 * Get cached data from Redis, or fetch fresh data and cache it.
 * Falls back gracefully if Redis is unavailable — just runs the fetcher.
 * 
 * @param key - Cache key
 * @param ttlSeconds - Time to live in seconds
 * @param fetcher - Function to call if cache misses
 */
export async function getCachedData<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const client = getRedisClient();

  if (client) {
    try {
      // Try to get from cache
      const cached = await client.get<T>(key);
      if (cached !== null && cached !== undefined) {
        return cached;
      }
    } catch (error) {
      // Redis read failed — fall through to fetcher
      console.error(`Redis GET error for key "${key}":`, error);
    }
  }

  // Cache miss or Redis unavailable — fetch fresh data
  const fresh = await fetcher();

  if (client && fresh !== null && fresh !== undefined) {
    try {
      await client.set(key, JSON.stringify(fresh), { ex: ttlSeconds });
    } catch (error) {
      // Redis write failed — not critical, data was still fetched
      console.error(`Redis SET error for key "${key}":`, error);
    }
  }

  return fresh;
}

/**
 * Invalidate a specific cache key.
 */
export async function invalidateCache(key: string): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    await client.del(key);
  } catch (error) {
    console.error(`Redis DEL error for key "${key}":`, error);
  }
}

/**
 * Invalidate all cache keys matching a pattern.
 * Useful when turf data changes (e.g., after owner updates).
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await Promise.all(keys.map(key => client.del(key)));
    }
  } catch (error) {
    console.error(`Redis pattern invalidation error for "${pattern}":`, error);
  }
}

export { getRedisClient };
