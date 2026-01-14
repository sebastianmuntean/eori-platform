import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { users } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { requireAuth } from '@/lib/auth';
import { logRequest, logResponse, logError as logErrorSecure } from '@/lib/logger';
import { logUpdate, extractIpAddress, extractUserAgent } from '@/lib/audit/audit-logger';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
});

/**
 * @openapi
 * /api/profile:
 *   get:
 *     summary: Get current user's profile
 *     description: Returns the full profile information for the currently authenticated user.
 *     tags: [Profile]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User profile information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     address:
 *                       type: string
 *                     city:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     role:
 *                       type: string
 *                     parishId:
 *                       type: string
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
export async function GET(request: Request) {
  logRequest('/api/profile', 'GET');

  try {
    const { userId, user } = await requireAuth();

    if (!userId || !user) {
      logResponse('/api/profile', 'GET', 401);
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Return full profile data (excluding passwordHash)
    const { passwordHash, ...profileData } = user;

    logResponse('/api/profile', 'GET', 200);
    return NextResponse.json({
      success: true,
      data: profileData,
    });
  } catch (error) {
    logErrorSecure('Error getting profile', error, { endpoint: '/api/profile', method: 'GET' });
    logError(error, { endpoint: '/api/profile', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * @openapi
 * /api/profile:
 *   put:
 *     summary: Update current user's profile
 *     description: Updates the profile information for the currently authenticated user.
 *     tags: [Profile]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
export async function PUT(request: Request) {
  logRequest('/api/profile', 'PUT');

  try {
    const { userId, user: currentUser } = await requireAuth();

    if (!userId || !currentUser) {
      logResponse('/api/profile', 'PUT', 401);
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      logResponse('/api/profile', 'PUT', 400);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // Check if email is being changed and if it's already taken
    if (validation.data.email && validation.data.email !== currentUser.email) {
      const [emailUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, validation.data.email))
        .limit(1);

      if (emailUser) {
        logResponse('/api/profile', 'PUT', 400);
        return NextResponse.json(
          { success: false, error: 'Email is already taken' },
          { status: 400 }
        );
      }
    }

    // Capture before state for audit log
    const beforeState = {
      name: currentUser.name,
      email: currentUser.email,
      address: currentUser.address,
      city: currentUser.city,
      phone: currentUser.phone,
    };

    const updateData: {
      updatedAt: Date;
      name?: string;
      email?: string;
      address?: string | null;
      city?: string | null;
      phone?: string | null;
    } = {
      updatedAt: new Date(),
    };

    if (validation.data.name !== undefined) {
      updateData.name = validation.data.name;
    }
    if (validation.data.email !== undefined) {
      updateData.email = validation.data.email;
    }
    if (validation.data.address !== undefined) {
      updateData.address = validation.data.address || null;
    }
    if (validation.data.city !== undefined) {
      updateData.city = validation.data.city || null;
    }
    if (validation.data.phone !== undefined) {
      updateData.phone = validation.data.phone || null;
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    // Log audit event for profile update
    const afterState = {
      name: updatedUser.name,
      email: updatedUser.email,
      address: updatedUser.address,
      city: updatedUser.city,
      phone: updatedUser.phone,
    };

    logUpdate(
      userId,
      'user',
      userId,
      { before: beforeState, after: afterState },
      {
        ipAddress: extractIpAddress(request),
        userAgent: extractUserAgent(request),
        requestMethod: 'PUT',
        endpoint: '/api/profile',
      }
    ).catch((err) => {
      console.error('Failed to log profile update audit event:', err);
    });

    const { passwordHash, ...profileData } = updatedUser;

    logResponse('/api/profile', 'PUT', 200);
    return NextResponse.json({
      success: true,
      data: profileData,
    });
  } catch (error) {
    logErrorSecure('Error updating profile', error, { endpoint: '/api/profile', method: 'PUT' });
    logError(error, { endpoint: '/api/profile', method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}
