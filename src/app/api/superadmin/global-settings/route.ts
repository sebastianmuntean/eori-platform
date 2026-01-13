import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { globalSettings } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateSettingSchema = z.object({
  key: z.string().min(1, 'Key is required').max(100),
  value: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

/**
 * GET /api/superadmin/global-settings - Get all global settings
 */
export async function GET(request: Request) {
  try {
    const { userId } = await getCurrentUser();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    if (key) {
      // Get single setting by key
      const [setting] = await db
        .select()
        .from(globalSettings)
        .where(eq(globalSettings.key, key))
        .limit(1);

      if (!setting) {
        return NextResponse.json(
          { success: false, error: 'Setting not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: setting,
      });
    }

    // Get all settings
    const settings = await db.select().from(globalSettings);

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/superadmin/global-settings', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * PUT /api/superadmin/global-settings - Update a global setting
 */
export async function PUT(request: Request) {
  try {
    const { userId } = await getCurrentUser();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = updateSettingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { key, value, description } = validation.data;

    // Check if setting exists
    const [existing] = await db
      .select()
      .from(globalSettings)
      .where(eq(globalSettings.key, key))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Setting not found' },
        { status: 404 }
      );
    }

    // Update setting
    const [updated] = await db
      .update(globalSettings)
      .set({
        value: value ?? null,
        description: description ?? existing.description,
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(globalSettings.key, key))
      .returning();

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/superadmin/global-settings', method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

