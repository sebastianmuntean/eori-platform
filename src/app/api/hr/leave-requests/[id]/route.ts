import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { leaveRequests } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateLeaveRequestSchema = z.object({
  employeeId: z.string().uuid().optional(),
  leaveTypeId: z.string().uuid().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  reason: z.string().optional().nullable(),
  status: z.enum(['pending', 'approved', 'rejected', 'cancelled']).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [request] = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, id))
      .limit(1);

    if (!request) {
      return NextResponse.json(
        { success: false, error: 'Leave request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: request,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/leave-requests/[id]', method: 'GET' });
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
    const validation = updateLeaveRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.employeeId !== undefined) updateData.employeeId = data.employeeId;
    if (data.leaveTypeId !== undefined) updateData.leaveTypeId = data.leaveTypeId;
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.endDate !== undefined) updateData.endDate = data.endDate;
    if (data.reason !== undefined) updateData.reason = data.reason;
    if (data.status !== undefined) updateData.status = data.status;

    // Recalculate total days if dates changed
    if (data.startDate !== undefined || data.endDate !== undefined) {
      const current = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id)).limit(1);
      if (current[0]) {
        const start = new Date(data.startDate || current[0].startDate);
        const end = new Date(data.endDate || current[0].endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        updateData.totalDays = diffDays;
      }
    }

    const [updatedRequest] = await db
      .update(leaveRequests)
      .set(updateData)
      .where(eq(leaveRequests.id, id))
      .returning();

    if (!updatedRequest) {
      return NextResponse.json(
        { success: false, error: 'Leave request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedRequest,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/leave-requests/[id]', method: 'PUT' });
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
    const [deletedRequest] = await db
      .delete(leaveRequests)
      .where(eq(leaveRequests.id, id))
      .returning();

    if (!deletedRequest) {
      return NextResponse.json(
        { success: false, error: 'Leave request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedRequest,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/leave-requests/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}







