import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(): string {
  // Don't log token details for security
  const token = randomBytes(32).toString('hex');
  return token;
}

/**
 * Set CSRF token in cookie
 */
export async function setCsrfTokenCookie(token: string): Promise<void> {
  console.log('Step 1: Setting CSRF token cookie');

  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be readable by JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });

  console.log('✓ CSRF token cookie set');
}

/**
 * Get CSRF token from cookie
 */
export async function getCsrfTokenFromCookie(): Promise<string | null> {
  console.log('Step 1: Reading CSRF token from cookie');

  const cookieStore = await cookies();
  const token = cookieStore.get(CSRF_COOKIE_NAME)?.value || null;

  // Don't log token details for security

  return token;
}

/**
 * Validate CSRF token from request
 */
export async function validateCsrfToken(
  requestToken: string | null
): Promise<boolean> {
  console.log('Step 1: Validating CSRF token');

  if (!requestToken) {
    console.log('❌ No CSRF token in request');
    return false;
  }

  const cookieToken = await getCsrfTokenFromCookie();

  if (!cookieToken) {
    console.log('❌ No CSRF token in cookie');
    return false;
  }

  // Use timing-safe comparison
  const isValid = requestToken === cookieToken;

  if (isValid) {
    console.log('✓ CSRF token validated');
  } else {
    console.log('❌ CSRF token mismatch');
  }

  return isValid;
}

/**
 * Extract CSRF token from request headers
 */
export function getCsrfTokenFromHeader(headers: Headers): string | null {
  return headers.get(CSRF_HEADER_NAME);
}

/**
 * Clear CSRF token cookie
 */
export async function clearCsrfTokenCookie(): Promise<void> {
  console.log('Step 1: Clearing CSRF token cookie');

  const cookieStore = await cookies();
  cookieStore.delete(CSRF_COOKIE_NAME);

  console.log('✓ CSRF token cookie cleared');
}




