import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { contracts } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, sql } from 'drizzle-orm';

/**
 * GET /api/accounting/contracts/[id]/documents - Get all documents for a contract
 * 
 * Note: This uses the attachments table with entity_type='contract'
 * The attachments table structure should be:
 * - id, parish_id, entity_type, entity_id, file_name, original_name, mime_type, file_size, storage_key, description, uploaded_at, uploaded_by
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: GET /api/accounting/contracts/${id}/documents - Fetching documents`);

  try {
    // Check if contract exists
    const [contract] = await db
      .select()
      .from(contracts)
      .where(eq(contracts.id, id))
      .limit(1);

    if (!contract) {
      console.log(`❌ Contract ${id} not found`);
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Query attachments table directly using raw SQL
    // This assumes the attachments table exists and has the structure mentioned above
    const attachments = await db.execute(sql`
      SELECT * FROM attachments
      WHERE entity_type = 'contract' AND entity_id = ${id}
      ORDER BY uploaded_at DESC
    `);

    console.log(`✓ Found ${attachments.rows?.length || 0} documents`);
    return NextResponse.json({
      success: true,
      data: attachments.rows || [],
    });
  } catch (error) {
    console.error('❌ Error fetching documents:', error);
    logError(error, { endpoint: '/api/accounting/contracts/[id]/documents', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/accounting/contracts/[id]/documents - Upload a document
 * 
 * Note: This is a placeholder - full file upload implementation would require
 * file storage handling similar to events documents route
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: POST /api/accounting/contracts/${id}/documents - Uploading document`);

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
      .from(contracts)
      .where(eq(contracts.id, id))
      .limit(1);

    if (!contract) {
      console.log(`❌ Contract ${id} not found`);
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    // TODO: Implement file upload logic similar to events documents
    // This would require:
    // 1. Parse form data
    // 2. Validate file
    // 3. Save file to storage
    // 4. Insert record into attachments table

    return NextResponse.json(
      {
        success: false,
        error: 'Document upload not yet implemented',
      },
      { status: 501 }
    );
  } catch (error) {
    console.error('❌ Error uploading document:', error);
    logError(error, { endpoint: '/api/accounting/contracts/[id]/documents', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}



