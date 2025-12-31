import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { users } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { hashPassword, validatePasswordStrength } from '@/lib/auth';
import { eq, and, gt } from 'drizzle-orm';
import { z } from 'zod';

const setPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password confirmation is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

/**
 * GET /api/auth/confirm-password - Verify confirmation token
 */
export async function GET(request: Request) {
  console.log('Step 1: GET /api/auth/confirm-password - Verifying token');

  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      console.log('❌ Missing token parameter');
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    console.log(`Step 2: Looking up user with token: ${token.substring(0, 8)}...`);

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

    if (!user) {
      console.log('❌ Invalid or expired token');
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    console.log(`✓ Token verified for user: ${user.email}`);
    return NextResponse.json({
      success: true,
      data: {
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('❌ Error verifying token:', error);
    logError(error, { endpoint: '/api/auth/confirm-password', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/auth/confirm-password - Set password via confirmation token
 */
export async function POST(request: Request) {
  console.log('Step 1: POST /api/auth/confirm-password - Setting password');

  try {
    const body = await request.json();
    console.log('Step 2: Validating request body');
    const validation = setPasswordSchema.safeParse(body);

    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { token, password } = validation.data;

    console.log('Step 3: Validating password strength');
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      console.log('❌ Password validation failed:', passwordValidation.errors);
      return NextResponse.json(
        {
          success: false,
          error: passwordValidation.errors.join(', '),
        },
        { status: 400 }
      );
    }

    console.log(`Step 4: Looking up user with token: ${token.substring(0, 8)}...`);

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

    if (!user) {
      console.log('❌ Invalid or expired token');
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    console.log(`Step 5: Hashing password for user: ${user.email}`);
    const passwordHash = await hashPassword(password);

    console.log('Step 6: Updating user password and clearing verification token');
    await db
      .update(users)
      .set({
        passwordHash,
        verificationCode: null,
        verificationCodeExpiry: null,
        isActive: true,
        approvalStatus: 'approved',
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    console.log(`✓ Password set successfully for user: ${user.email}`);
    return NextResponse.json({
      success: true,
      message: 'Password set successfully. You can now log in.',
    });
  } catch (error) {
    console.error('❌ Error setting password:', error);
    logError(error, { endpoint: '/api/auth/confirm-password', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

