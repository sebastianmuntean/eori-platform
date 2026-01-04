import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { parishes } from '@/database/schema';
import { formatErrorResponse, logError, ValidationError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import {
  validateDiocese,
  validateDeaneryBelongsToDiocese,
  validateParishCodeUnique,
} from '../_validation';

const updateParishSchema = z.object({
  deaneryId: z.string().uuid().optional().nullable(),
  dioceseId: z.string().uuid().optional(),
  code: z.string().min(1).max(20).optional(),
  name: z.string().min(1).optional(),
  patronSaintDay: z.string().optional().nullable(),
  address: z.string().optional(),
  city: z.string().optional(),
  county: z.string().optional(),
  postalCode: z.string().optional(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  priestName: z.string().optional(),
  vicarName: z.string().optional(),
  parishionerCount: z.number().int().optional().nullable(),
  foundedYear: z.number().int().optional().nullable(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

const uuidSchema = z.string().uuid('Invalid parish ID format');

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    // Validate UUID format
    const idValidation = uuidSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid parish ID format' },
        { status: 400 }
      );
    }

    const [parish] = await db
      .select()
      .from(parishes)
      .where(eq(parishes.id, id))
      .limit(1);

    if (!parish) {
      return NextResponse.json(
        { success: false, error: 'Parish not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: parish,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/parishes/[id]', method: 'GET' });
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
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    // Validate UUID format
    const idValidation = uuidSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid parish ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = updateParishSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          errors: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Get current parish to validate relationships
    const [currentParish] = await db
      .select()
      .from(parishes)
      .where(eq(parishes.id, id))
      .limit(1);

    if (!currentParish) {
      return NextResponse.json(
        { success: false, error: 'Parish not found' },
        { status: 404 }
      );
    }

    // Determine which diocese to use (provided or current)
    const dioceseId = data.dioceseId || currentParish.dioceseId;

    // Validate diocese if provided
    if (data.dioceseId) {
      await validateDiocese(data.dioceseId);
    }

    // Validate deanery belongs to diocese if provided
    if (data.deaneryId && dioceseId) {
      await validateDeaneryBelongsToDiocese(data.deaneryId, dioceseId);
    } else if (data.deaneryId && !data.dioceseId) {
      // If deanery is provided but diocese is not, validate against current diocese
      await validateDeaneryBelongsToDiocese(data.deaneryId, currentParish.dioceseId);
    }

    // Validate parish code is unique (excluding current parish)
    if (data.code) {
      await validateParishCodeUnique(data.code, id);
    }

    // Build update data
    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    };

    const [updatedParish] = await db
      .update(parishes)
      .set(updateData)
      .where(eq(parishes.id, id))
      .returning();

    if (!updatedParish) {
      return NextResponse.json(
        { success: false, error: 'Parish not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedParish,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/parishes/[id]', method: 'PUT' });
    
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    
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
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    // Validate UUID format
    const idValidation = uuidSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid parish ID format' },
        { status: 400 }
      );
    }

    const [deletedParish] = await db
      .delete(parishes)
      .where(eq(parishes.id, id))
      .returning();

    if (!deletedParish) {
      return NextResponse.json(
        { success: false, error: 'Parish not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedParish,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/parishes/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}
