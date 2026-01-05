import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'); // 1 minute default
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'); // 100 requests default

// Auth-specific rate limits
const LOGIN_RATE_LIMIT_MAX = parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '5'); // 5 attempts
const LOGIN_RATE_LIMIT_WINDOW = parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW || '900000'); // 15 minutes
const PASSWORD_RESET_RATE_LIMIT_MAX = parseInt(process.env.PASSWORD_RESET_RATE_LIMIT_MAX || '3'); // 3 attempts
const PASSWORD_RESET_RATE_LIMIT_WINDOW = parseInt(process.env.PASSWORD_RESET_RATE_LIMIT_WINDOW || '3600000'); // 1 hour

/**
 * Get client identifier from Request or NextRequest (IP address or user ID)
 */
function getClientIdentifier(request: Request | NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }
  
  // Handle both Request and NextRequest
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return `ip:${forwarded.split(',')[0].trim()}`;
  }
  
  // For NextRequest, try request.ip
  if ('ip' in request && request.ip) {
    return `ip:${request.ip}`;
  }
  
  return 'ip:unknown';
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
 * Check rate limit for a Request object (used in API routes)
 */
export async function checkRateLimit(
  request: Request,
  maxRequests: number = RATE_LIMIT_MAX_REQUESTS,
  windowMs: number = RATE_LIMIT_WINDOW_MS
): Promise<{ allowed: boolean; response?: NextResponse }> {
  const identifier = getClientIdentifier(request);
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
    return { allowed: true };
  }

  if (entry.resetAt < now) {
    // Window expired, reset
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { allowed: true };
  }

  if (entry.count >= maxRequests) {
    // Rate limit exceeded
    return {
      allowed: false,
      response: NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((entry.resetAt - now) / 1000).toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(entry.resetAt).toISOString(),
          },
        }
      ),
    };
  }

  // Increment count
  entry.count++;
  return { allowed: true };
}

/**
 * Check rate limit for login attempts
 */
export async function checkLoginRateLimit(request: Request): Promise<{ allowed: boolean; response?: NextResponse }> {
  return checkRateLimit(request, LOGIN_RATE_LIMIT_MAX, LOGIN_RATE_LIMIT_WINDOW);
}

/**
 * Check rate limit for password reset attempts
 */
export async function checkPasswordResetRateLimit(request: Request): Promise<{ allowed: boolean; response?: NextResponse }> {
  return checkRateLimit(request, PASSWORD_RESET_RATE_LIMIT_MAX, PASSWORD_RESET_RATE_LIMIT_WINDOW);
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




