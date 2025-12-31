import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Add security headers to response
 */
export function addSecurityHeaders(request: NextRequest, response: NextResponse): NextResponse {
  console.log('Step 1: Adding security headers');

  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  );

  // X-Frame-Options - prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // X-Content-Type-Options - prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Referrer-Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  // Strict-Transport-Security (HSTS) - only in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // X-XSS-Protection (legacy, but still useful)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  console.log('✓ Security headers added');
  return response;
}




