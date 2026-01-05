import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { employees } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser, checkPermission } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateEmployeeSchema = z.object({
  parishId: z.string().uuid().optional(),
  userId: z.string().uuid().optional().nullable(),
  employeeNumber: z.string().min(1).max(50).optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  cnp: z.string().max(13).optional().nullable(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  county: z.string().max(100).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  positionId: z.string().uuid().optional().nullable(),
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  employmentStatus: z.enum(['active', 'on_leave', 'terminated', 'retired']).optional(),
  terminationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  terminationReason: z.string().optional().nullable(),
  bankName: z.string().max(255).optional().nullable(),
  iban: z.string().max(34).optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/hr/employees/[id] - Get employee by ID
 */
export async function GET(
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

    const hasPermission = await checkPermission('hr.employees.view');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, id))
      .limit(1);

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: employee,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/employees/[id]', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * PUT /api/hr/employees/[id] - Update employee
 */
export async function PUT(
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

    const hasPermission = await checkPermission('hr.employees.update');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = updateEmployeeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if employee exists
    const [existingEmployee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, id))
      .limit(1);

    if (!existingEmployee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updatedBy: userId,
      updatedAt: new Date(),
    };

    if (data.parishId !== undefined) updateData.parishId = data.parishId;
    if (data.userId !== undefined) updateData.userId = data.userId;
    if (data.employeeNumber !== undefined) updateData.employeeNumber = data.employeeNumber;
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.cnp !== undefined) updateData.cnp = data.cnp;
    if (data.birthDate !== undefined) updateData.birthDate = data.birthDate;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.county !== undefined) updateData.county = data.county;
    if (data.postalCode !== undefined) updateData.postalCode = data.postalCode;
    if (data.departmentId !== undefined) updateData.departmentId = data.departmentId;
    if (data.positionId !== undefined) updateData.positionId = data.positionId;
    if (data.hireDate !== undefined) updateData.hireDate = data.hireDate;
    if (data.employmentStatus !== undefined) updateData.employmentStatus = data.employmentStatus;
    if (data.terminationDate !== undefined) updateData.terminationDate = data.terminationDate;
    if (data.terminationReason !== undefined) updateData.terminationReason = data.terminationReason;
    if (data.bankName !== undefined) updateData.bankName = data.bankName;
    if (data.iban !== undefined) updateData.iban = data.iban;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const [updatedEmployee] = await db
      .update(employees)
      .set(updateData)
      .where(eq(employees.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedEmployee,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/employees/[id]', method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * DELETE /api/hr/employees/[id] - Delete employee
 */
export async function DELETE(
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

    const hasPermission = await checkPermission('hr.employees.delete');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const [deletedEmployee] = await db
      .delete(employees)
      .where(eq(employees.id, id))
      .returning();

    if (!deletedEmployee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedEmployee,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/employees/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

