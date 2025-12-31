import { NextResponse } from 'next/server';
import { login } from '@/lib/auth';
import { validateAndSanitize, emailSchema, passwordSchema } from '@/lib/validation';
import { formatErrorResponse, logError } from '@/lib/errors';
import { z } from 'zod';
import { db } from '@/database/client';
import { users } from '@/database/schema';
import { eq } from 'drizzle-orm';

const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export async function POST(request: Request) {
  console.log('Step 1: POST /api/auth/login - Processing login request');

  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    console.log(`Step 2: Attempting login for email: ${email}`);
    const result = await login(email, password);

    if (!result.success) {
      console.log(`❌ Login failed: ${result.error}`);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      );
    }

    if (!result.userId) {
      console.log(`❌ Login succeeded but no userId returned`);
      return NextResponse.json(
        { success: false, error: 'Login failed' },
        { status: 500 }
      );
    }

    // Fetch user data to return in response
    console.log(`Step 3: Fetching user data for userId: ${result.userId}`);
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
      })
      .from(users)
      .where(eq(users.id, result.userId))
      .limit(1);

    if (!user) {
      console.log(`❌ User not found after login: ${result.userId}`);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 500 }
      );
    }

    console.log(`✓ Login successful for user: ${user.id}`);
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    logError(error, { endpoint: '/api/auth/login', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}
