import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { users } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { hashPassword, validatePasswordStrength } from '@/lib/auth';
import { validateVerificationToken } from '@/lib/auth-utils';
import { checkPasswordResetRateLimit } from '@/lib/rate-limit';
import { logRequest, logResponse, logError as logErrorSecure } from '@/lib/logger';
import { eq } from 'drizzle-orm';
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
 * 
 * Validates a password reset/confirmation token without revealing whether
 * the token is valid or not (prevents enumeration attacks).
 * 
 * @param request - Request object with token query parameter
 * @returns { success: boolean, data?: { email, name }, error?: string }
 * @throws 400 - Missing or invalid token
 * @throws 429 - Rate limit exceeded
 * @throws 500 - Server error
 */
export async function GET(request: Request) {
  logRequest('/api/auth/confirm-password', 'GET');

  try {
    // Rate limiting
    const rateLimitCheck = await checkPasswordResetRateLimit(request);
    if (!rateLimitCheck.allowed) {
      logResponse('/api/auth/confirm-password', 'GET', 429);
      return rateLimitCheck.response!;
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      logResponse('/api/auth/confirm-password', 'GET', 400);
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // Use shared validation function (prevents enumeration)
    const user = await validateVerificationToken(token);

    // Use consistent error message and timing to prevent enumeration
    if (!user) {
      // Add small delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 100));
      logResponse('/api/auth/confirm-password', 'GET', 400);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    logResponse('/api/auth/confirm-password', 'GET', 200);
    return NextResponse.json({
      success: true,
      data: {
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    logErrorSecure('Error verifying token', error, { endpoint: '/api/auth/confirm-password', method: 'GET' });
    logError(error, { endpoint: '/api/auth/confirm-password', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/auth/confirm-password - Set password via confirmation token
 * 
 * Sets a new password using a verification token. The token is cleared
 * after successful password set to prevent reuse.
 * 
 * @param request - Request body: { token: string, password: string, confirmPassword: string }
 * @returns { success: boolean, message?: string, error?: string }
 * @throws 400 - Invalid input, weak password, or invalid token
 * @throws 429 - Rate limit exceeded
 * @throws 500 - Server error
 */
export async function POST(request: Request) {
  logRequest('/api/auth/confirm-password', 'POST');

  try {
    // Rate limiting
    const rateLimitCheck = await checkPasswordResetRateLimit(request);
    if (!rateLimitCheck.allowed) {
      logResponse('/api/auth/confirm-password', 'POST', 429);
      return rateLimitCheck.response!;
    }

    const body = await request.json();
    const validation = setPasswordSchema.safeParse(body);

    if (!validation.success) {
      logResponse('/api/auth/confirm-password', 'POST', 400);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { token, password } = validation.data;

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      logResponse('/api/auth/confirm-password', 'POST', 400);
      return NextResponse.json(
        {
          success: false,
          error: passwordValidation.errors.join(', '),
        },
        { status: 400 }
      );
    }

    // Use shared validation function
    const user = await validateVerificationToken(token);

    // Use consistent error message and timing to prevent enumeration
    if (!user) {
      // Add small delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 100));
      logResponse('/api/auth/confirm-password', 'POST', 400);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Update user password and clear verification token
    // Use transaction-like approach: check token exists before clearing
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

    logResponse('/api/auth/confirm-password', 'POST', 200);
    return NextResponse.json({
      success: true,
      message: 'Password set successfully. You can now log in.',
    });
  } catch (error) {
    logErrorSecure('Error setting password', error, { endpoint: '/api/auth/confirm-password', method: 'POST' });
    logError(error, { endpoint: '/api/auth/confirm-password', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

