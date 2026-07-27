import { NextRequest } from 'next/server';
import { prisma } from './prisma';

/**
 * Database-backed rate limiting.
 *
 * An in-memory Map only limits a single process. On Vercel (and any horizontally
 * scaled deploy) each request may hit a different instance, so an in-memory
 * counter provides essentially no protection against brute force. Persisting the
 * counter makes the limit hold across all instances.
 */

export interface RateLimitOptions {
  /** Bucket identifier, e.g. `login:${email}` */
  key: string;
  /** Attempts permitted within the window */
  limit: number;
  /** Window length in milliseconds */
  windowMs: number;
  /**
   * How long to lock the bucket once the limit is exceeded. Defaults to the
   * window length.
   */
  blockMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Seconds until the caller may retry; only meaningful when blocked */
  retryAfterSeconds: number;
}

/**
 * Consume one attempt from a bucket.
 *
 * Fails open: if the datastore is unreachable the request is allowed through,
 * because a broken limiter should not take login down entirely.
 */
export async function consumeRateLimit(
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const { key, limit, windowMs } = options;
  const blockMs = options.blockMs ?? windowMs;
  const now = new Date();

  try {
    const existing = await prisma.rate_limits.findUnique({ where: { key } });

    // Currently locked out
    if (existing?.blockedUntil && existing.blockedUntil > now) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.ceil(
          (existing.blockedUntil.getTime() - now.getTime()) / 1000
        ),
      };
    }

    const windowExpired =
      !existing || now.getTime() - existing.windowStart.getTime() >= windowMs;

    if (windowExpired) {
      await prisma.rate_limits.upsert({
        where: { key },
        create: { key, attempts: 1, windowStart: now, blockedUntil: null },
        update: { attempts: 1, windowStart: now, blockedUntil: null },
      });
      return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
    }

    const attempts = existing.attempts + 1;

    if (attempts > limit) {
      const blockedUntil = new Date(now.getTime() + blockMs);
      await prisma.rate_limits.update({
        where: { key },
        data: { attempts, blockedUntil },
      });
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.ceil(blockMs / 1000),
      };
    }

    await prisma.rate_limits.update({
      where: { key },
      data: { attempts },
    });

    return {
      allowed: true,
      remaining: limit - attempts,
      retryAfterSeconds: 0,
    };
  } catch (error) {
    console.error('Rate limit check failed, allowing request:', error);
    return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
  }
}

/**
 * Clear a bucket — call after a successful login so a user who eventually
 * authenticates is not still counted against their failed attempts.
 */
export async function resetRateLimit(key: string): Promise<void> {
  try {
    await prisma.rate_limits.deleteMany({ where: { key } });
  } catch (error) {
    console.error('Failed to reset rate limit bucket:', error);
  }
}

/** Best-effort client IP for the request. */
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}
