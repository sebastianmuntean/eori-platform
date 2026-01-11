import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { pilgrimageMeals } from '@/database/schema';
import { formatErrorResponse, logError, AuthorizationError } from '@/lib/errors';
import { getCurrentUser, checkPermission } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getPilgrimageById } from '@/lib/services/pilgrimages-service';
import { isValidUUID, formatValidationErrors } from '@/lib/api-utils/validation';
import { requireParishAccess } from '@/lib/api-utils/authorization';

const createMealSchema = z.object({
  mealDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  mealTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  providerName: z.string().max(255).optional().nullable(),
  menuDescription: z.string().optional().nullable(),
  pricePerPerson: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().nullable(),
  dietaryOptions: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/pilgrimages/[id]/meals - Get all meals for a pilgrimage
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid pilgrimage ID format' },
        { status: 400 }
      );
    }

    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const hasPermission = await checkPermission('pilgrimages.view');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const pilgrimage = await getPilgrimageById(id);

    // Check parish access
    try {
      await requireParishAccess(pilgrimage.parishId, false);
    } catch (error) {
      if (error instanceof AuthorizationError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
      throw error;
    }

    const meals = await db
      .select()
      .from(pilgrimageMeals)
      .where(eq(pilgrimageMeals.pilgrimageId, id));

    return NextResponse.json({
      success: true,
      data: meals,
    });
  } catch (error) {
    console.error('❌ Error fetching meals:', error);
    logError(error, { endpoint: '/api/pilgrimages/[id]/meals', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/pilgrimages/[id]/meals - Create a new meal entry
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid pilgrimage ID format' },
        { status: 400 }
      );
    }

    const hasPermission = await checkPermission('pilgrimages.update');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const pilgrimage = await getPilgrimageById(id);

    // Check parish access
    try {
      await requireParishAccess(pilgrimage.parishId, true);
    } catch (error) {
      if (error instanceof AuthorizationError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
      throw error;
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const validation = createMealSchema.safeParse(body);

    if (!validation.success) {
      const errorDetails = formatValidationErrors(validation.error.errors);
      return NextResponse.json(
        {
          success: false,
          error: errorDetails.message,
          errors: errorDetails.errors,
          fields: errorDetails.fields,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    const [newMeal] = await db
      .insert(pilgrimageMeals)
      .values({
        pilgrimageId: id,
        mealDate: data.mealDate || null,
        mealType: data.mealType as any,
        mealTime: data.mealTime || null,
        location: data.location || null,
        providerName: data.providerName || null,
        menuDescription: data.menuDescription || null,
        pricePerPerson: data.pricePerPerson || null,
        dietaryOptions: data.dietaryOptions || null,
        notes: data.notes || null,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newMeal,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating meal:', error);
    logError(error, { endpoint: '/api/pilgrimages/[id]/meals', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}


