import { EnvManager } from "./env";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

function cleanup(): void {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}

setInterval(cleanup, 60 * 1000);

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const defaults: Record<string, RateLimitConfig> = {
  default: { windowMs: 60 * 1000, maxRequests: 100 },
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  api: { windowMs: 60 * 1000, maxRequests: 1000 },
  strict: { windowMs: 60 * 1000, maxRequests: 10 },
};

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = defaults.default,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const key = identifier;
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

export function getRateLimitConfig(type: string): RateLimitConfig {
  return defaults[type] || defaults.default;
}

export function getClientIdentifier(request: Request, prefix: string = ""): string {
  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";

  return `${prefix}:${ip}`;
}

export function getRateLimitHeaders(
  remaining: number,
  resetAt: number,
): Record<string, string> {
  const seconds = Math.ceil((resetAt - Date.now()) / 1000);
  return {
    "X-RateLimit-Limit": "100",
    "X-RateLimit-Remaining": remaining.toString(),
    "X-RateLimit-Reset": seconds.toString(),
  };
}