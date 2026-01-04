import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/config';

/**
 * Next.js Internationalization Middleware
 * 
 * This middleware handles locale routing for the application using next-intl.
 * It automatically redirects routes to include the locale prefix and validates
 * locale values.
 * 
 * The matcher pattern ensures that:
 * - All routes are processed except:
 *   - API routes (starting with `/api`)
 *   - Next.js internal routes (starting with `/_next`)
 *   - Vercel deployment routes (starting with `/_vercel`)
 *   - Static files (containing a dot, e.g., `favicon.ico`, `robots.txt`)
 * 
 * Pattern explanation: `/((?!api|_next|_vercel|.*\\..*).*)`
 * - `(?!...)` - Negative lookahead (exclude patterns)
 * - `api|_next|_vercel` - Exclude routes starting with these prefixes
 * - `.*\\..*` - Exclude routes containing a dot (static files)
 * - `.*` - Match everything else
 */
export default createMiddleware(routing);

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


