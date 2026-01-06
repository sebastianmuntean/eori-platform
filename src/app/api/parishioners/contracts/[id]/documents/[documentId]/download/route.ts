import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { parishionerContracts, contractDocuments } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq, and } from 'drizzle-orm';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

/**
 * GET /api/parishioners/contracts/[id]/documents/[documentId]/download - Download document
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const { id, documentId } = await params;

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

    // Get document
    const [document] = await db
      .select()
      .from(contractDocuments)
      .where(and(eq(contractDocuments.id, documentId), eq(contractDocuments.contractId, id)))
      .limit(1);

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check if file exists
    if (!existsSync(document.storagePath)) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Read file
    const fileBuffer = await readFile(document.storagePath);

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': document.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${document.fileName}"`,
        'Content-Length': document.fileSize.toString(),
      },
    });
  } catch (error) {
    logError(error, { endpoint: '/api/parishioners/contracts/[id]/documents/[documentId]/download', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}







