import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { onlineForms, onlineFormFieldMappings } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { updateFieldMappingSchema } from '@/lib/validations/online-forms';

/**
 * PUT /api/online-forms/[id]/mappings/[mappingId] - Update a field mapping
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; mappingId: string }> }
) {
  const { id, mappingId } = await params;
  console.log(`Step 1: PUT /api/online-forms/${id}/mappings/${mappingId} - Updating mapping`);

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if form exists
    const [form] = await db
      .select()
      .from(onlineForms)
      .where(eq(onlineForms.id, id))
      .limit(1);

    if (!form) {
      return NextResponse.json(
        { success: false, error: 'Form not found' },
        { status: 404 }
      );
    }

    // Check if mapping exists
    const [existingMapping] = await db
      .select()
      .from(onlineFormFieldMappings)
      .where(
        and(
          eq(onlineFormFieldMappings.id, mappingId),
          eq(onlineFormFieldMappings.formId, id)
        )
      )
      .limit(1);

    if (!existingMapping) {
      return NextResponse.json(
        { success: false, error: 'Mapping not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = updateFieldMappingSchema.safeParse(body);

    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Update mapping
    const [updatedMapping] = await db
      .update(onlineFormFieldMappings)
      .set(data)
      .where(eq(onlineFormFieldMappings.id, mappingId))
      .returning();

    console.log(`✓ Mapping updated: ${updatedMapping.id}`);
    return NextResponse.json({
      success: true,
      data: updatedMapping,
    });
  } catch (error) {
    logError(error, { endpoint: `/api/online-forms/${id}/mappings/${mappingId}`, method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * DELETE /api/online-forms/[id]/mappings/[mappingId] - Delete a field mapping
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; mappingId: string }> }
) {
  const { id, mappingId } = await params;
  console.log(`Step 1: DELETE /api/online-forms/${id}/mappings/${mappingId} - Deleting mapping`);

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if form exists
    const [form] = await db
      .select()
      .from(onlineForms)
      .where(eq(onlineForms.id, id))
      .limit(1);

    if (!form) {
      return NextResponse.json(
        { success: false, error: 'Form not found' },
        { status: 404 }
      );
    }

    // Check if mapping exists
    const [existingMapping] = await db
      .select()
      .from(onlineFormFieldMappings)
      .where(
        and(
          eq(onlineFormFieldMappings.id, mappingId),
          eq(onlineFormFieldMappings.formId, id)
        )
      )
      .limit(1);

    if (!existingMapping) {
      return NextResponse.json(
        { success: false, error: 'Mapping not found' },
        { status: 404 }
      );
    }

    // Delete mapping
    await db
      .delete(onlineFormFieldMappings)
      .where(eq(onlineFormFieldMappings.id, mappingId));

    console.log(`✓ Mapping deleted: ${mappingId}`);
    return NextResponse.json({
      success: true,
      message: 'Mapping deleted successfully',
    });
  } catch (error) {
    logError(error, { endpoint: `/api/online-forms/${id}/mappings/${mappingId}`, method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}




