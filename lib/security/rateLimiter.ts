export interface RateLimiterConfig {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export function createRateLimiter(config: RateLimiterConfig) {
  const store = new Map<string, RateLimitEntry>();

  function check(key: string): RateLimitResult {
    const now = Date.now();
    const entry = store.get(key);

    // Lazy cleanup: if the window has passed, reset the entry
    if (entry && now >= entry.resetAt) {
      store.delete(key);
    }

    const current = store.get(key);

    if (!current) {
      store.set(key, { count: 1, resetAt: now + config.windowMs });
      return { allowed: true };
    }

    if (current.count < config.maxRequests) {
      current.count += 1;
      return { allowed: true };
    }

    const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  function reset(key: string): void {
    store.delete(key);
  }

  return { check, reset };
}
