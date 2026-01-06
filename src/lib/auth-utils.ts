import { db } from '@/database/client';
import { users } from '@/database/schema';
import { eq, and, gt } from 'drizzle-orm';

/**
 * Validate verification token and return user if valid
 * Returns null if token is invalid or expired (prevents enumeration)
 */
export async function validateVerificationToken(token: string): Promise<typeof users.$inferSelect | null> {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.verificationCode, token),
          gt(users.verificationCodeExpiry, new Date())
        )
      )
      .limit(1);

    return user || null;
  } catch (error) {
    // Return null on error to prevent information disclosure
    return null;
  }
}







