import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { pilgrimageMeals } from '@/database/schema';
import { formatErrorResponse, logError, AuthorizationError } from '@/lib/errors';
import { getCurrentUser, checkPermission } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { getPilgrimageById } from '@/lib/services/pilgrimages-service';
import { isValidUUID, formatValidationErrors } from '@/lib/api-utils/validation';
import { requireParishAccess } from '@/lib/api-utils/authorization';

const updateMealSchema = z.object({
  mealDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
  mealTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  providerName: z.string().max(255).optional().nullable(),
  menuDescription: z.string().optional().nullable(),
  pricePerPerson: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().nullable(),
  dietaryOptions: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/pilgrimages/[id]/meals/[mealId] - Get meal by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; mealId: string }> }
) {
  const { id, mealId } = await params;

  try {
    // Validate UUID format
    if (!isValidUUID(id) || !isValidUUID(mealId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
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

    const [meal] = await db
      .select()
      .from(pilgrimageMeals)
      .where(
        and(
          eq(pilgrimageMeals.id, mealId),
          eq(pilgrimageMeals.pilgrimageId, id)
        )
      )
      .limit(1);

    if (!meal) {
      return NextResponse.json(
        { success: false, error: 'Meal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: meal,
    });
  } catch (error) {
    console.error('❌ Error fetching meal:', error);
    logError(error, { endpoint: '/api/pilgrimages/[id]/meals/[mealId]', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * PUT /api/pilgrimages/[id]/meals/[mealId] - Update meal
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; mealId: string }> }
) {
  const { id, mealId } = await params;

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Validate UUID format
    if (!isValidUUID(id) || !isValidUUID(mealId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
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

    const validation = updateMealSchema.safeParse(body);

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

    const [existingMeal] = await db
      .select()
      .from(pilgrimageMeals)
      .where(
        and(
          eq(pilgrimageMeals.id, mealId),
          eq(pilgrimageMeals.pilgrimageId, id)
        )
      )
      .limit(1);

    if (!existingMeal) {
      return NextResponse.json(
        { success: false, error: 'Meal not found' },
        { status: 404 }
      );
    }

    const updateData: any = { ...data };
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const [updatedMeal] = await db
      .update(pilgrimageMeals)
      .set(updateData)
      .where(eq(pilgrimageMeals.id, mealId))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedMeal,
    });
  } catch (error) {
    console.error('❌ Error updating meal:', error);
    logError(error, { endpoint: '/api/pilgrimages/[id]/meals/[mealId]', method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * DELETE /api/pilgrimages/[id]/meals/[mealId] - Delete meal
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; mealId: string }> }
) {
  const { id, mealId } = await params;

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Validate UUID format
    if (!isValidUUID(id) || !isValidUUID(mealId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
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

    const [deletedMeal] = await db
      .delete(pilgrimageMeals)
      .where(
        and(
          eq(pilgrimageMeals.id, mealId),
          eq(pilgrimageMeals.pilgrimageId, id)
        )
      )
      .returning();

    if (!deletedMeal) {
      return NextResponse.json(
        { success: false, error: 'Meal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedMeal,
    });
  } catch (error) {
    console.error('❌ Error deleting meal:', error);
    logError(error, { endpoint: '/api/pilgrimages/[id]/meals/[mealId]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}


