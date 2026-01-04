import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { dioceses, deaneries, parishes } from '@/database/schema';
import { formatErrorResponse, logError, ValidationError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { updateDioceseSchema, dioceseIdSchema } from '@/lib/validations/dioceses';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    // Validate UUID format
    const idValidation = dioceseIdSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        formatErrorResponse(new ValidationError('Invalid diocese ID format')),
        { status: 400 }
      );
    }

    const [diocese] = await db
      .select()
      .from(dioceses)
      .where(eq(dioceses.id, id))
      .limit(1);

    if (!diocese) {
      return NextResponse.json(
        { success: false, error: 'Diocese not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: diocese,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/dioceses/[id]', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    // Validate UUID format
    const idValidation = dioceseIdSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        formatErrorResponse(new ValidationError('Invalid diocese ID format')),
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = updateDioceseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        formatErrorResponse(new ValidationError(validation.error.errors[0].message)),
        { status: 400 }
      );
    }

    const data = validation.data;

    if (data.code) {
      const existingDiocese = await db
        .select()
        .from(dioceses)
        .where(eq(dioceses.code, data.code))
        .limit(1);

      if (existingDiocese.length > 0 && existingDiocese[0].id !== id) {
        return NextResponse.json(
          { success: false, error: 'Diocese with this code already exists' },
          { status: 400 }
        );
      }
    }

    const [updatedDiocese] = await db
      .update(dioceses)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(dioceses.id, id))
      .returning();

    if (!updatedDiocese) {
      return NextResponse.json(
        { success: false, error: 'Diocese not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedDiocese,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/dioceses/[id]', method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    // Validate UUID format
    const idValidation = dioceseIdSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        formatErrorResponse(new ValidationError('Invalid diocese ID format')),
        { status: 400 }
      );
    }

    // Check if diocese exists
    const [diocese] = await db
      .select()
      .from(dioceses)
      .where(eq(dioceses.id, id))
      .limit(1);

    if (!diocese) {
      return NextResponse.json(
        { success: false, error: 'Diocese not found' },
        { status: 404 }
      );
    }

    // Check for related records before attempting delete
    const deaneriesResult = await db
      .select()
      .from(deaneries)
      .where(eq(deaneries.dioceseId, id));

    const parishesResult = await db
      .select()
      .from(parishes)
      .where(eq(parishes.dioceseId, id));

    const deaneriesCount = deaneriesResult.length;
    const parishesCount = parishesResult.length;
    const totalRelated = deaneriesCount + parishesCount;

    if (totalRelated > 0) {
      const parts: string[] = [];
      if (deaneriesCount > 0) {
        parts.push(`${deaneriesCount} deanerie${deaneriesCount > 1 ? 's' : ''}`);
      }
      if (parishesCount > 0) {
        parts.push(`${parishesCount} parishe${parishesCount > 1 ? 's' : ''}`);
      }

      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete diocese because it has associated records: ${parts.join(', ')}. Please delete these records first or apply cascade delete migration.`,
        },
        { status: 409 }
      );
    }

    // Attempt to delete
    const [deletedDiocese] = await db
      .delete(dioceses)
      .where(eq(dioceses.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: deletedDiocese,
    });
  } catch (error: any) {
    // Check if it's a foreign key constraint error
    const errorMessage = error?.message || '';
    const errorCode = error?.code || '';

    // PostgreSQL foreign key constraint violation code is '23503'
    if (errorCode === '23503' || errorMessage.includes('foreign key constraint') || errorMessage.includes('violates foreign key constraint')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete diocese because it has associated records (deaneries or parishes). Please delete these records first or apply cascade delete migration.',
        },
        { status: 409 }
      );
    }

    logError(error, { endpoint: '/api/dioceses/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}


