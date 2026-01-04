/**
 * Rate Limiting Middleware
 * 
 * Prevents brute force attacks and DoS by limiting request frequency
 */

import { NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/api-utils/error-handling';

// Simple in-memory rate limiter (use Redis in production for distributed systems)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Check if request should be rate limited
 * @param identifier - Unique identifier (e.g., email, IP address, userId)
 * @param maxAttempts - Maximum number of attempts allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes default
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired entry
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (entry.count >= maxAttempts) {
    return false; // Rate limited
  }

  // Increment count
  entry.count++;
  return true;
}

/**
 * Get remaining attempts for an identifier
 */
export function getRemainingAttempts(
  identifier: string,
  maxAttempts: number = 5
): number {
  const entry = rateLimitStore.get(identifier);
  if (!entry || entry.resetTime < Date.now()) {
    return maxAttempts;
  }
  return Math.max(0, maxAttempts - entry.count);
}

/**
 * Get reset time for an identifier
 */
export function getResetTime(identifier: string): number | null {
  const entry = rateLimitStore.get(identifier);
  if (!entry || entry.resetTime < Date.now()) {
    return null;
  }
  return entry.resetTime;
}

/**
 * Require rate limiting for an endpoint
 * Returns null if rate limit check passes, or an error response if rate limited
 */
export function requireRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000
): NextResponse | null {
  const isAllowed = checkRateLimit(identifier, maxAttempts, windowMs);

  if (!isAllowed) {
    const resetTime = getResetTime(identifier);
    const retryAfter = resetTime ? Math.ceil((resetTime - Date.now()) / 1000) : windowMs / 1000;
    
    return createErrorResponse(
      `Too many requests. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
      429
    );
  }

  return null;
}

/**
 * Get client identifier from request
 */
export function getClientIdentifier(request: Request, userId?: string | null): string {
  // Use userId if available (more accurate)
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP address
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';
  
  return `ip:${ip}`;
}

