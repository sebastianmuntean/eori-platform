import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { positions } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updatePositionSchema = z.object({
  parishId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional().nullable(),
  code: z.string().min(1).max(50).optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  minSalary: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().nullable(),
  maxSalary: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [position] = await db
      .select()
      .from(positions)
      .where(eq(positions.id, id))
      .limit(1);

    if (!position) {
      return NextResponse.json(
        { success: false, error: 'Position not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: position,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/positions/[id]', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const validation = updatePositionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;
    const updateData: any = { updatedAt: new Date() };

    if (data.parishId !== undefined) updateData.parishId = data.parishId;
    if (data.departmentId !== undefined) updateData.departmentId = data.departmentId;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.minSalary !== undefined) updateData.minSalary = data.minSalary;
    if (data.maxSalary !== undefined) updateData.maxSalary = data.maxSalary;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const [updatedPosition] = await db
      .update(positions)
      .set(updateData)
      .where(eq(positions.id, id))
      .returning();

    if (!updatedPosition) {
      return NextResponse.json(
        { success: false, error: 'Position not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedPosition,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/positions/[id]', method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [deletedPosition] = await db
      .delete(positions)
      .where(eq(positions.id, id))
      .returning();

    if (!deletedPosition) {
      return NextResponse.json(
        { success: false, error: 'Position not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedPosition,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/positions/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

