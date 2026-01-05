import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { timeEntries } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateTimeEntrySchema = z.object({
  employeeId: z.string().uuid().optional(),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  checkInTime: z.string().optional().nullable(),
  checkOutTime: z.string().optional().nullable(),
  breakDurationMinutes: z.number().int().min(0).optional(),
  workedHours: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().nullable(),
  overtimeHours: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  status: z.enum(['present', 'absent', 'late', 'half_day', 'holiday', 'sick_leave', 'vacation']).optional(),
  notes: z.string().optional().nullable(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [entry] = await db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.id, id))
      .limit(1);

    if (!entry) {
      return NextResponse.json(
        { success: false, error: 'Time entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: entry,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/time-entries/[id]', method: 'GET' });
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
    const validation = updateTimeEntrySchema.safeParse(body);

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
    if (data.entryDate !== undefined) updateData.entryDate = data.entryDate;
    if (data.checkInTime !== undefined) updateData.checkInTime = data.checkInTime;
    if (data.checkOutTime !== undefined) updateData.checkOutTime = data.checkOutTime;
    if (data.breakDurationMinutes !== undefined) updateData.breakDurationMinutes = data.breakDurationMinutes;
    if (data.workedHours !== undefined) updateData.workedHours = data.workedHours;
    if (data.overtimeHours !== undefined) updateData.overtimeHours = data.overtimeHours;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const [updatedEntry] = await db
      .update(timeEntries)
      .set(updateData)
      .where(eq(timeEntries.id, id))
      .returning();

    if (!updatedEntry) {
      return NextResponse.json(
        { success: false, error: 'Time entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedEntry,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/time-entries/[id]', method: 'PUT' });
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
    const [deletedEntry] = await db
      .delete(timeEntries)
      .where(eq(timeEntries.id, id))
      .returning();

    if (!deletedEntry) {
      return NextResponse.json(
        { success: false, error: 'Time entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedEntry,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/time-entries/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}



