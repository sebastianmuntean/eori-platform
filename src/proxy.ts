import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/config';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { addSecurityHeaders } from './lib/security-headers';

/**
 * Next.js Proxy with Internationalization, Authentication, and Security Headers
 * 
 * This proxy handles:
 * 1. Locale routing for the application using next-intl
 * 2. Authentication protection for /dashboard routes
 * 3. Security headers
 */
const intlMiddleware = createMiddleware(routing);

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'session';

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Extract locale from pathname (format: /{locale}/...)
  const pathnameHasLocale = routing.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  let locale = routing.defaultLocale;
  if (pathnameHasLocale) {
    const segments = pathname.split('/');
    locale = segments[1] as typeof routing.defaultLocale;
  }

  // Check if this is a dashboard route that requires authentication
  const isDashboardRoute = pathname.includes('/dashboard');
  const isPublicRoute = 
    pathname.includes('/login') ||
    pathname.includes('/register') ||
    pathname.includes('/forgot-password') ||
    pathname.includes('/reset-password') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/_vercel/') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2|ttf|eot)$/);

  // Protect dashboard routes - require authentication
  if (isDashboardRoute && !isPublicRoute) {
    // Get session token from cookie (middleware uses request.cookies)
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      // No session token found, redirect to login
      const loginUrl = new URL(`/${locale}/login`, request.url);
      // Preserve the original URL as a redirect parameter
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Note: Full session validation (checking database) happens at page level
    // This middleware check provides first-layer protection by ensuring a token exists
    // The page-level authentication check will validate token validity and expiration
  }

  // Apply i18n middleware for locale routing
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





