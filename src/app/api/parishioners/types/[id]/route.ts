import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { parishionerTypes } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateTypeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/parishioners/types/[id] - Get a single parishioner type
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [type] = await db
      .select()
      .from(parishionerTypes)
      .where(eq(parishionerTypes.id, id))
      .limit(1);

    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Parishioner type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: type,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/parishioners/types/[id]', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * PUT /api/parishioners/types/[id] - Update a parishioner type
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validation = updateTypeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    const [existingType] = await db
      .select()
      .from(parishionerTypes)
      .where(eq(parishionerTypes.id, id))
      .limit(1);

    if (!existingType) {
      return NextResponse.json(
        { success: false, error: 'Parishioner type not found' },
        { status: 404 }
      );
    }

    const updateData: any = {
      updatedBy: userId,
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const [updatedType] = await db
      .update(parishionerTypes)
      .set(updateData)
      .where(eq(parishionerTypes.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedType,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/parishioners/types/[id]', method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * DELETE /api/parishioners/types/[id] - Delete a parishioner type
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;

    const [type] = await db
      .select()
      .from(parishionerTypes)
      .where(eq(parishionerTypes.id, id))
      .limit(1);

    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Parishioner type not found' },
        { status: 404 }
      );
    }

    await db.delete(parishionerTypes).where(eq(parishionerTypes.id, id));

    return NextResponse.json({
      success: true,
      message: 'Parishioner type deleted successfully',
    });
  } catch (error) {
    logError(error, { endpoint: '/api/parishioners/types/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

