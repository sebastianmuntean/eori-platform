import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { employeeDocuments, employees, employmentContracts } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, desc } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { z } from 'zod';

const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads', 'hr', 'employee-documents');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const createDocumentSchema = z.object({
  contractId: z.string().uuid().optional().nullable(),
  documentType: z.enum(['contract', 'id_card', 'diploma', 'certificate', 'medical', 'other']),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional().nullable(),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  isConfidential: z.boolean().optional().default(false),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

    // Get all documents for this employee
    const documents = await db
      .select()
      .from(employeeDocuments)
      .where(eq(employeeDocuments.employeeId, id))
      .orderBy(desc(employeeDocuments.createdAt));

    return NextResponse.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/employees/[id]/documents', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const metadataStr = formData.get('metadata') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Parse metadata
    let metadata;
    if (metadataStr) {
      try {
        metadata = JSON.parse(metadataStr);
      } catch {
        return NextResponse.json(
          { success: false, error: 'Invalid metadata format' },
          { status: 400 }
        );
      }
    }

    const validation = createDocumentSchema.safeParse(metadata || {});
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if contract exists (if provided)
    if (data.contractId) {
      const [existingContract] = await db
        .select()
        .from(employmentContracts)
        .where(eq(employmentContracts.id, data.contractId))
        .limit(1);

      if (!existingContract) {
        return NextResponse.json(
          { success: false, error: 'Contract not found' },
          { status: 400 }
        );
      }
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || '';
    const uniqueFileName = `${randomUUID()}.${fileExtension}`;
    const storagePath = join(UPLOAD_DIR, id, uniqueFileName);

    // Ensure upload directory exists
    try {
      await mkdir(join(UPLOAD_DIR, id), { recursive: true });
    } catch (error) {
      // Continue anyway - might already exist
    }

    // Save file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(storagePath, buffer);

    // Create document record
    const [newDocument] = await db
      .insert(employeeDocuments)
      .values({
        employeeId: id,
        contractId: data.contractId || null,
        documentType: data.documentType,
        title: data.title,
        description: data.description || null,
        filePath: storagePath,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
        issueDate: data.issueDate || null,
        expiryDate: data.expiryDate || null,
        isConfidential: data.isConfidential ?? false,
        createdBy: userId,
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
    logError(error, { endpoint: '/api/hr/employees/[id]/documents', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}



