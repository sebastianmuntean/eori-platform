import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Generate a cryptographically secure nonce using Web Crypto API
 * This works in Edge Runtime (Next.js middleware environment)
 */
function generateNonce(): string {
  // Use Web Crypto API which is available in Edge Runtime
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  // Convert to base64 for use in CSP nonce
  // Use btoa with binary string conversion (Edge-compatible)
  const binaryString = String.fromCharCode(...array);
  return btoa(binaryString);
}

/**
 * Add security headers to response
 */
export function addSecurityHeaders(request: NextRequest, response: NextResponse): NextResponse {
  console.log('Step 1: Adding security headers');

  // Content Security Policy
  // Note: 'unsafe-inline' and 'unsafe-eval' are still needed for Next.js
  // Consider implementing nonce-based CSP in the future for better security
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none';"
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




