import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'); // 1 minute default
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'); // 100 requests default

/**
 * Get client identifier (IP address or user ID)
 */
function getClientIdentifier(request: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
  return `ip:${ip}`;
}

/**
 * Rate limit middleware
 */
export function rateLimit(
  maxRequests: number = RATE_LIMIT_MAX_REQUESTS,
  windowMs: number = RATE_LIMIT_WINDOW_MS
) {
  return (request: NextRequest, userId?: string): NextResponse | null => {
    console.log(`Step 1: Rate limiting check`);

    const identifier = getClientIdentifier(request, userId);
    const now = Date.now();

    // Clean up expired entries
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }

    // Get or create rate limit entry
    const entry = rateLimitStore.get(identifier);

    if (!entry) {
      // First request
      rateLimitStore.set(identifier, {
        count: 1,
        resetAt: now + windowMs,
      });
      console.log(`✓ Rate limit OK: 1/${maxRequests}`);
      return null;
    }

    if (entry.resetAt < now) {
      // Window expired, reset
      rateLimitStore.set(identifier, {
        count: 1,
        resetAt: now + windowMs,
      });
      console.log(`✓ Rate limit OK: 1/${maxRequests}`);
      return null;
    }

    if (entry.count >= maxRequests) {
      // Rate limit exceeded
      console.log(`❌ Rate limit exceeded: ${entry.count}/${maxRequests}`);
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((entry.resetAt - now) / 1000).toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(entry.resetAt).toISOString(),
          },
        }
      );
    }

    // Increment count
    entry.count++;
    console.log(`✓ Rate limit OK: ${entry.count}/${maxRequests}`);
    return null;
  };
}

/**
 * Cleanup rate limit store (call periodically)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}




