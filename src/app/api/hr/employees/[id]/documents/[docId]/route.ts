import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { employeeDocuments, employees } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { readFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const { id, docId } = await params;

  try {
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

    return NextResponse.json({
      success: true,
      data: document,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/employees/[id]/documents/[docId]', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const { id, docId } = await params;

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
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

    // Delete file from filesystem
    if (existsSync(document.filePath)) {
      try {
        await unlink(document.filePath);
      } catch (error) {
        // Log but continue with database deletion
        console.error('Error deleting file:', error);
      }
    }

    // Delete document record
    const [deletedDocument] = await db
      .delete(employeeDocuments)
      .where(eq(employeeDocuments.id, docId))
      .returning();

    return NextResponse.json({
      success: true,
      data: deletedDocument,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/employees/[id]/documents/[docId]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}



