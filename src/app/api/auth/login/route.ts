import { NextResponse } from 'next/server';
import { login } from '@/lib/auth';
import { emailSchema, passwordSchema } from '@/lib/validation';
import { formatErrorResponse, logError } from '@/lib/errors';
import { checkLoginRateLimit } from '@/lib/rate-limit';
import { logRequest, logResponse, logAuthAttempt, logError as logErrorSecure } from '@/lib/logger';
import { logLogin, extractIpAddress, extractUserAgent } from '@/lib/audit/audit-logger';
import { z } from 'zod';

const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user and create session
 *     description: |
 *       Validates user credentials and creates a session if successful.
 *       Includes rate limiting to prevent brute force attacks.
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePassword123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: 123e4567-e89b-12d3-a456-426614174000
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: user@example.com
 *                     name:
 *                       type: string
 *                       example: John Doe
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               error: "Invalid email address"
 *       401:
 *         description: Invalid credentials or account not active/approved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               error: "Invalid credentials"
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               error: "Too many login attempts. Please try again later."
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(request: Request) {
  logRequest('/api/auth/login', 'POST');

  try {
    // Rate limiting
    const rateLimitCheck = await checkLoginRateLimit(request);
    if (!rateLimitCheck.allowed) {
      const ip = request.headers.get('x-forwarded-for') || 'unknown';
      logAuthAttempt(ip, false, { endpoint: '/api/auth/login', reason: 'rate_limit' });
      logResponse('/api/auth/login', 'POST', 429);
      return rateLimitCheck.response!;
    }

    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      logResponse('/api/auth/login', 'POST', 400);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;

    // Attempt login
    const result = await login(email, password, ip, userAgent);

    if (!result.success) {
      logAuthAttempt(ip, false, { endpoint: '/api/auth/login', reason: result.error });
      logResponse('/api/auth/login', 'POST', 401);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      );
    }

    if (!result.user) {
      logAuthAttempt(ip, false, { endpoint: '/api/auth/login', reason: 'no_user_data' });
      logResponse('/api/auth/login', 'POST', 500);
      return NextResponse.json(
        { success: false, error: 'Login failed' },
        { status: 500 }
      );
    }

    logAuthAttempt(ip, true, { endpoint: '/api/auth/login', userId: result.userId });
    
    // Log audit event for successful login
    if (result.userId) {
      logLogin(result.userId, extractIpAddress(request), extractUserAgent(request)).catch((err) => {
        console.error('Failed to log login audit event:', err);
      });
    }
    
    logResponse('/api/auth/login', 'POST', 200);
    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
    });
  } catch (error) {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    logAuthAttempt(ip, false, { endpoint: '/api/auth/login', reason: 'exception' });
    logErrorSecure('Error during login', error, { endpoint: '/api/auth/login', method: 'POST' });
    logError(error, { endpoint: '/api/auth/login', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}
