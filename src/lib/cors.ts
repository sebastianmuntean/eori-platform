import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000'];

/**
 * Check if origin is allowed
 * Supports wildcard subdomains (e.g., *.example.com)
 */
function isOriginAllowed(origin: string | null): boolean {
  if (!origin) {
    // Allow null origin only for same-origin requests (e.g., file:// protocol)
    // In most cases, we should reject null origins for security
    return false;
  }

  // Exact match
  if (ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }

  // Support wildcard subdomains (e.g., *.example.com)
  for (const allowed of ALLOWED_ORIGINS) {
    if (allowed.startsWith('*.')) {
      const domain = allowed.slice(2);
      // Match subdomain or exact domain
      if (origin === domain || origin.endsWith(`.${domain}`)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Add CORS headers to response
 */
export function addCorsHeaders(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  console.log('Step 1: Adding CORS headers');

  const origin = request.headers.get('origin');

  if (isOriginAllowed(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin!);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-CSRF-Token'
    );
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours

    console.log(`✓ CORS headers added for origin: ${origin}`);
  } else {
    console.log(`❌ Origin not allowed: ${origin}`);
  }

  return response;
}

/**
 * Handle CORS preflight request
 */
export function handleCorsPreflight(
  request: NextRequest
): NextResponse | null {
  console.log('Step 1: Handling CORS preflight request');

  const origin = request.headers.get('origin');

  if (!isOriginAllowed(origin)) {
    console.log(`❌ Origin not allowed: ${origin}`);
    return new NextResponse(null, { status: 403 });
  }

  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(request, response);
}




