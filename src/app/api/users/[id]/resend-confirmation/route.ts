import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { users } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { sendUserConfirmationEmail } from '@/lib/email';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';

/**
 * Generate a secure verification token
 */
function generateVerificationToken(): string {
  console.log('Step 1: Generating verification token');
  const token = randomBytes(32).toString('hex');
  console.log(`✓ Verification token generated: ${token.substring(0, 8)}...`);
  return token;
}

/**
 * POST /api/users/[id]/resend-confirmation - Resend confirmation email to user
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('Step 1: POST /api/users/[id]/resend-confirmation - Resending confirmation email');

  try {
    const userId = params.id;

    if (!userId) {
      console.log('❌ Missing user ID');
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log(`Step 2: Looking up user ${userId}`);
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      console.log(`❌ User with id ${userId} not found`);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    console.log(`✓ User found: ${user.email}`);

    // Generate new verification token
    console.log('Step 3: Generating new verification token');
    const verificationToken = generateVerificationToken();
    const verificationExpiry = new Date();
    verificationExpiry.setDate(verificationExpiry.getDate() + 7); // 7 days from now

    // Update user record with the new token
    await db
      .update(users)
      .set({
        verificationCode: verificationToken,
        verificationCodeExpiry: verificationExpiry,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Generate confirmation link
    const locale = 'ro'; // Default locale, can be passed from request
    const confirmationLink = `${process.env.APP_URL || 'http://localhost:4058'}/${locale}/confirm-password?token=${verificationToken}`;

    console.log('Step 4: Sending confirmation email');
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.name || user.email}`);
    console.log(`  Confirmation link: ${confirmationLink.substring(0, 50)}...`);

    // Send confirmation email
    await sendUserConfirmationEmail(
      user.email,
      user.name || user.email,
      confirmationLink
    );

    console.log(`✓ Confirmation email resent successfully to ${user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Confirmation email sent successfully',
      data: {
        userId: user.id,
        email: user.email,
        // Return token for testing (remove in production)
        verificationToken,
      },
    });
  } catch (error) {
    console.error('❌ Error resending confirmation email:', error);
    logError(error, { endpoint: '/api/users/[id]/resend-confirmation', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

