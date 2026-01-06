import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { formMappingDatasets, onlineFormFieldMappings, onlineForms } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const applyDatasetSchema = z.object({
  formId: z.string().uuid(),
  replaceExisting: z.boolean().default(false),
});

/**
 * POST /api/online-forms/mapping-datasets/[id]/apply - Apply dataset to a form
 */
export async function POST(
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

    const { id: datasetId } = await params;
    const body = await request.json();
    const validation = applyDatasetSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { formId, replaceExisting } = validation.data;

    // Get dataset
    const [dataset] = await db
      .select()
      .from(formMappingDatasets)
      .where(eq(formMappingDatasets.id, datasetId))
      .limit(1);

    if (!dataset) {
      return NextResponse.json(
        { success: false, error: 'Dataset not found' },
        { status: 404 }
      );
    }

    // Get form
    const [form] = await db
      .select()
      .from(onlineForms)
      .where(eq(onlineForms.id, formId))
      .limit(1);

    if (!form) {
      return NextResponse.json(
        { success: false, error: 'Form not found' },
        { status: 404 }
      );
    }

    // Check if target module matches
    if (form.targetModule !== dataset.targetModule) {
      return NextResponse.json(
        { success: false, error: 'Target module mismatch' },
        { status: 400 }
      );
    }

    // Delete existing mappings if replaceExisting is true
    if (replaceExisting) {
      await db
        .delete(onlineFormFieldMappings)
        .where(eq(onlineFormFieldMappings.formId, formId));
    }

    // Apply mappings from dataset
    const mappings = dataset.mappings as Array<{
      fieldKey: string;
      targetTable: string;
      targetColumn: string;
      mappingType?: string;
      sqlQuery?: string;
      transformation?: any;
    }>;

    if (mappings && mappings.length > 0) {
      const newMappings = mappings.map((mapping) => ({
        formId,
        fieldKey: mapping.fieldKey,
        targetTable: mapping.targetTable,
        targetColumn: mapping.targetColumn,
        transformation: mapping.transformation || null,
      }));

      await db.insert(onlineFormFieldMappings).values(newMappings);
    }

    return NextResponse.json({
      success: true,
      message: `Applied ${mappings?.length || 0} mappings to form`,
      data: { mappingsApplied: mappings?.length || 0 },
    });
  } catch (error) {
    logError(error, { endpoint: '/api/online-forms/mapping-datasets/[id]/apply', method: 'POST' });
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(
      {
        success: false,
        error: errorResponse.error,
      },
      { status: errorResponse.statusCode }
    );
  }
}




