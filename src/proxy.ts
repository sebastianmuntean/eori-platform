import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/config';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { addSecurityHeaders } from './lib/security-headers';

/**
 * Next.js Proxy with Internationalization and Security Headers
 * 
 * This proxy handles locale routing for the application using next-intl
 * and adds security headers to all responses.
 */
const intlMiddleware = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  // Apply i18n middleware first
  const response = intlMiddleware(request);
  
  // Add security headers to all responses
  return addSecurityHeaders(request, response);
}

export const config = {
  matcher: [
    // Match all pathnames except static files and API routes
    // This pattern uses negative lookahead to exclude:
    // - API routes: /api/*
    // - Next.js internals: /_next/*
    // - Vercel internals: /_vercel/*
    // - Static files: any path containing a dot (e.g., favicon.ico, robots.txt)
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};





