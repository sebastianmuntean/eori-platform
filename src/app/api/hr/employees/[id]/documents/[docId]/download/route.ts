import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { employeeDocuments, employees } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const { id, docId } = await params;

  try {
    // Check authentication (required for confidential documents)
    const { userId } = await getCurrentUser();

    // Check if employee exists
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

    // Get document
    const [document] = await db
      .select()
      .from(employeeDocuments)
      .where(
        and(
          eq(employeeDocuments.id, docId),
          eq(employeeDocuments.employeeId, id)
        )
      )
      .limit(1);

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check if file exists
    if (!existsSync(document.filePath)) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Read file
    const fileBuffer = await readFile(document.filePath);

    // Return file
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': document.mimeType,
        'Content-Disposition': `attachment; filename="${document.fileName}"`,
        'Content-Length': document.fileSize.toString(),
      },
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/employees/[id]/documents/[docId]/download', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}







