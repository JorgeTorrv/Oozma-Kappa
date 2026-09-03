/**
 * Rate limiting básico en memoria para el login (spec §21). Suficiente para una
 * instancia local / demo; en producción con varias réplicas se usaría Redis.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 15 * 60 * 1000; // 15 min
const MAX_ATTEMPTS = 8;

export function checkLoginRateLimit(key: string): {
  allowed: boolean;
  retryAfterSec: number;
} {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSec: 0 };
  }

  bucket.count += 1;
  if (bucket.count > MAX_ATTEMPTS) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }
  return { allowed: true, retryAfterSec: 0 };
}

/** Reinicia el contador tras un login correcto. */
export function resetLoginRateLimit(key: string): void {
  buckets.delete(key);
}
