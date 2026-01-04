import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { departments, parishes } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const updateDepartmentSchema = z.object({
  parishId: z.string().uuid().optional(),
  code: z.string().min(1).max(20).optional(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  headName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/departments/[id] - Get department by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: GET /api/departments/${id} - Fetching department`);

  try {
    const [department] = await db
      .select()
      .from(departments)
      .where(eq(departments.id, id))
      .limit(1);

    if (!department) {
      console.log(`❌ Department ${id} not found`);
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      );
    }

    console.log(`✓ Department found: ${department.name}`);
    return NextResponse.json({
      success: true,
      data: department,
    });
  } catch (error) {
    console.error('❌ Error fetching department:', error);
    logError(error, { endpoint: '/api/departments/[id]', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * PUT /api/departments/[id] - Update department
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: PUT /api/departments/${id} - Updating department`);

  try {
    const body = await request.json();
    const validation = updateDepartmentSchema.safeParse(body);

    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if department exists
    const [existingDepartment] = await db
      .select()
      .from(departments)
      .where(eq(departments.id, id))
      .limit(1);

    if (!existingDepartment) {
      console.log(`❌ Department ${id} not found`);
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      );
    }

    // Check if parish exists (if being updated)
    if (data.parishId) {
      console.log(`Step 2: Checking if parish ${data.parishId} exists`);
      const [existingParish] = await db
        .select()
        .from(parishes)
        .where(eq(parishes.id, data.parishId))
        .limit(1);

      if (!existingParish) {
        console.log(`❌ Parish ${data.parishId} not found`);
        return NextResponse.json(
          { success: false, error: 'Parish not found' },
          { status: 400 }
        );
      }
    }

    // Check for duplicate code within the same parish (if code or parishId is being updated)
    if (data.code || data.parishId) {
      const checkParishId = data.parishId || existingDepartment.parishId;
      const checkCode = data.code || existingDepartment.code;

      console.log(`Step 3: Checking for duplicate code ${checkCode} in parish ${checkParishId}`);
      const duplicateDepartments = await db
        .select()
        .from(departments)
        .where(
          and(
            eq(departments.parishId, checkParishId),
            eq(departments.code, checkCode)
          )
        )
        .limit(2);

      // Check if there's a different department with the same code
      const duplicate = duplicateDepartments.find((d) => d.id !== id);
      if (duplicate) {
        console.log(`❌ Department with code ${checkCode} already exists in this parish`);
        return NextResponse.json(
          { success: false, error: 'Department with this code already exists in this parish' },
          { status: 400 }
        );
      }
    }

    // Update department
    console.log('Step 4: Updating department');
    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    };

    const [updatedDepartment] = await db
      .update(departments)
      .set(updateData)
      .where(eq(departments.id, id))
      .returning();

    if (!updatedDepartment) {
      console.log(`❌ Department ${id} not found after update`);
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      );
    }

    console.log(`✓ Department updated successfully: ${updatedDepartment.id}`);
    return NextResponse.json({
      success: true,
      data: updatedDepartment,
    });
  } catch (error) {
    console.error('❌ Error updating department:', error);
    logError(error, { endpoint: '/api/departments/[id]', method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * DELETE /api/departments/[id] - Delete department
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: DELETE /api/departments/${id} - Deleting department`);

  try {
    const [deletedDepartment] = await db
      .delete(departments)
      .where(eq(departments.id, id))
      .returning();

    if (!deletedDepartment) {
      console.log(`❌ Department ${id} not found`);
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      );
    }

    console.log(`✓ Department deleted successfully: ${deletedDepartment.id}`);
    return NextResponse.json({
      success: true,
      data: deletedDepartment,
    });
  } catch (error) {
    console.error('❌ Error deleting department:', error);
    logError(error, { endpoint: '/api/departments/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

