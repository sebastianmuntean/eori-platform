import { cookies } from 'next/headers';
import { db } from '@/database/client';
import { sessions } from '@/database/schema';
import { eq, and, gt } from 'drizzle-orm';
import { randomBytes } from 'crypto';

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'session';
const SESSION_MAX_AGE = parseInt(process.env.SESSION_MAX_AGE || '604800'); // 7 days default

// Removed: Default token and user ID for mock authentication

/**
 * Generate a cryptographically secure random session token
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Create a new session and set cookie
 */
export async function createSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  console.log(`Step 1: Creating session for user ${userId}`);
  
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  try {
    await db.insert(sessions).values({
      userId,
      token,
      expiresAt,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });

    console.log(`✓ Session created with token: ${token.substring(0, 8)}...`);
    return token;
  } catch (error) {
    console.error(`❌ Failed to create session: ${error}`);
    throw error;
  }
}

/**
 * Set session cookie in response
 */
export async function setSessionCookie(token: string) {
  console.log(`Step 1: Setting session cookie`);
  
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });

  console.log(`✓ Session cookie set`);
}

/**
 * Get session token from cookie
 */
export async function getSessionToken(): Promise<string | null> {
  console.log(`Step 1: Reading session token from cookie`);
  
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value || null;

  if (token) {
    console.log(`✓ Session token found: ${token.substring(0, 8)}...`);
  } else {
    console.log(`❌ No session token found`);
  }

  return token;
}

/**
 * Validate session token and return user ID
 */
export async function validateSession(token: string): Promise<string | null> {
  console.log(`Step 1: Validating session token: ${token.substring(0, 8)}...`);

  try {
    const [session] = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.token, token),
          gt(sessions.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!session) {
      console.log(`❌ Session not found or expired`);
      return null;
    }

    // Update last_used_at
    await db
      .update(sessions)
      .set({ lastUsedAt: new Date() })
      .where(eq(sessions.id, session.id));

    console.log(`✓ Session validated for user ${session.userId}`);
    return session.userId;
  } catch (error) {
    console.error(`❌ Failed to validate session: ${error}`);
    return null;
  }
}

// Removed: getDefaultToken() and getDefaultUserId() functions - no longer needed for mock authentication

/**
 * Delete session from database
 */
export async function deleteSession(token: string): Promise<void> {
  console.log(`Step 1: Deleting session: ${token.substring(0, 8)}...`);

  try {
    await db.delete(sessions).where(eq(sessions.token, token));
    console.log(`✓ Session deleted`);
  } catch (error) {
    console.error(`❌ Failed to delete session: ${error}`);
    throw error;
  }
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  console.log(`Step 1: Clearing session cookie`);

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);

  console.log(`✓ Session cookie cleared`);
}

/**
 * Delete all sessions for a user (e.g., on password change)
 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
  console.log(`Step 1: Deleting all sessions for user ${userId}`);

  try {
    await db.delete(sessions).where(eq(sessions.userId, userId));
    console.log(`✓ All sessions deleted for user ${userId}`);
  } catch (error) {
    console.error(`❌ Failed to delete user sessions: ${error}`);
    throw error;
  }
}

