import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { deaneries, dioceses } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const updateDeanerySchema = z.object({
  dioceseId: z.string().uuid().optional(),
  code: z.string().min(1).max(20).optional(),
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  county: z.string().optional(),
  deanName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [deanery] = await db
      .select()
      .from(deaneries)
      .where(eq(deaneries.id, id))
      .limit(1);

    if (!deanery) {
      return NextResponse.json(
        { success: false, error: 'Deanery not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deanery,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/deaneries/[id]', method: 'GET' });
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
    const { id } = await params;
    const body = await request.json();
    const validation = updateDeanerySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    if (data.dioceseId) {
      const existingDiocese = await db
        .select()
        .from(dioceses)
        .where(eq(dioceses.id, data.dioceseId))
        .limit(1);

      if (existingDiocese.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Diocese not found' },
          { status: 400 }
        );
      }
    }

    if (data.code) {
      const currentDeanery = await db
        .select()
        .from(deaneries)
        .where(eq(deaneries.id, id))
        .limit(1);

      if (currentDeanery.length > 0) {
        const dioceseIdToCheck = data.dioceseId || currentDeanery[0].dioceseId;
        const existingDeanery = await db
          .select()
          .from(deaneries)
          .where(
            and(
              eq(deaneries.dioceseId, dioceseIdToCheck),
              eq(deaneries.code, data.code)
            )
          )
          .limit(1);

        if (existingDeanery.length > 0 && existingDeanery[0].id !== id) {
          return NextResponse.json(
            { success: false, error: 'Deanery with this code already exists in this diocese' },
            { status: 400 }
          );
        }
      }
    }

    const [updatedDeanery] = await db
      .update(deaneries)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(deaneries.id, id))
      .returning();

    if (!updatedDeanery) {
      return NextResponse.json(
        { success: false, error: 'Deanery not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedDeanery,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/deaneries/[id]', method: 'PUT' });
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
    const { id } = await params;
    const [deletedDeanery] = await db
      .delete(deaneries)
      .where(eq(deaneries.id, id))
      .returning();

    if (!deletedDeanery) {
      return NextResponse.json(
        { success: false, error: 'Deanery not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedDeanery,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/deaneries/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}


