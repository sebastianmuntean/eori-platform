import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { contractDocuments, parishionerContracts } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { uploadParishionerFile } from '@/lib/services/parishioner-file-service';

/**
 * GET /api/parishioners/contracts/[id]/documents - Get all documents for a contract
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if contract exists
    const [contract] = await db
      .select()
      .from(parishionerContracts)
      .where(eq(parishionerContracts.id, id))
      .limit(1);

    if (!contract) {
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    const documents = await db
      .select()
      .from(contractDocuments)
      .where(eq(contractDocuments.contractId, id));

    return NextResponse.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/parishioners/contracts/[id]/documents', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/parishioners/contracts/[id]/documents - Upload document
 */
export async function POST(
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

    // Check if contract exists
    const [contract] = await db
      .select()
      .from(parishionerContracts)
      .where(eq(parishionerContracts.id, id))
      .limit(1);

    if (!contract) {
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = (formData.get('documentType') as string) || 'contract';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Upload file using shared service
    const uploadResult = await uploadParishionerFile({
      entityId: id,
      file,
      uploadedBy: userId,
      uploadDir: 'parishioner-contracts',
    });

    // Create document record
    const [newDocument] = await db
      .insert(contractDocuments)
      .values({
        contractId: id,
        fileName: uploadResult.fileName,
        storageName: uploadResult.storageName,
        storagePath: uploadResult.storagePath,
        mimeType: uploadResult.mimeType,
        fileSize: uploadResult.fileSize,
        documentType: documentType as 'contract' | 'amendment' | 'renewal' | 'other',
        uploadedBy: userId,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newDocument,
      },
      { status: 201 }
    );
  } catch (error) {
    logError(error, { endpoint: '/api/parishioners/contracts/[id]/documents', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

