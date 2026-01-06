import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { leaveTypes } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateLeaveTypeSchema = z.object({
  parishId: z.string().uuid().optional().nullable(),
  code: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  maxDaysPerYear: z.number().int().min(0).optional().nullable(),
  isPaid: z.boolean().optional(),
  requiresApproval: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [leaveType] = await db
      .select()
      .from(leaveTypes)
      .where(eq(leaveTypes.id, id))
      .limit(1);

    if (!leaveType) {
      return NextResponse.json(
        { success: false, error: 'Leave type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: leaveType,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/leave-types/[id]', method: 'GET' });
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
    const validation = updateLeaveTypeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;
    const updateData: any = { updatedAt: new Date() };

    if (data.parishId !== undefined) updateData.parishId = data.parishId;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.maxDaysPerYear !== undefined) updateData.maxDaysPerYear = data.maxDaysPerYear;
    if (data.isPaid !== undefined) updateData.isPaid = data.isPaid;
    if (data.requiresApproval !== undefined) updateData.requiresApproval = data.requiresApproval;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const [updatedLeaveType] = await db
      .update(leaveTypes)
      .set(updateData)
      .where(eq(leaveTypes.id, id))
      .returning();

    if (!updatedLeaveType) {
      return NextResponse.json(
        { success: false, error: 'Leave type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedLeaveType,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/leave-types/[id]', method: 'PUT' });
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
    const [deletedLeaveType] = await db
      .delete(leaveTypes)
      .where(eq(leaveTypes.id, id))
      .returning();

    if (!deletedLeaveType) {
      return NextResponse.json(
        { success: false, error: 'Leave type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedLeaveType,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/leave-types/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}







