import { writeFile, readFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { createReadStream, existsSync } from 'fs';
import { Readable } from 'stream';
import { db } from '@/database/client';
import { documentAttachments } from '@/database/schema';
import { eq } from 'drizzle-orm';

// File storage directory
const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads', 'documents');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif',
  'text/plain',
  'text/csv',
];

export interface UploadFileParams {
  documentId: string;
  file: File | Buffer;
  fileName: string;
  mimeType?: string;
  uploadedBy: string;
}

export interface UploadFileResult {
  id: string;
  fileName: string;
  storageName: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
  version: number;
}

/**
 * Validate file type and size
 */
export function validateFile(file: File | { size: number; type: string }): {
  valid: boolean;
  error?: string;
} {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
    };
  }

  // Check MIME type if provided
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Upload a document file
 */
export async function uploadDocumentFile(
  params: UploadFileParams
): Promise<UploadFileResult> {
  const { documentId, file, fileName, mimeType, uploadedBy } = params;

  // Convert File to Buffer if needed
  let buffer: Buffer;
  let fileSize: number;
  let detectedMimeType: string;

  if (file instanceof File) {
    buffer = Buffer.from(await file.arrayBuffer());
    fileSize = file.size;
    detectedMimeType = file.type || mimeType || 'application/octet-stream';
  } else {
    buffer = file;
    fileSize = buffer.length;
    detectedMimeType = mimeType || 'application/octet-stream';
  }

  // Validate file
  const validation = validateFile({
    size: fileSize,
    type: detectedMimeType,
  });

  if (!validation.valid) {
    throw new Error(validation.error || 'File validation failed');
  }

  // Generate unique filename
  const fileExtension = fileName.split('.').pop() || '';
  const uniqueFileName = `${randomUUID()}.${fileExtension}`;
  const storagePath = join(UPLOAD_DIR, documentId, uniqueFileName);

  // Ensure upload directory exists
  try {
    await mkdir(join(UPLOAD_DIR, documentId), { recursive: true });
  } catch (error) {
    // Directory might already exist, continue
    if (!existsSync(join(UPLOAD_DIR, documentId))) {
      throw new Error('Failed to create upload directory');
    }
  }

  // Save file
  await writeFile(storagePath, buffer);

  // Create attachment record
  const [newAttachment] = await db
    .insert(documentAttachments)
    .values({
      documentId,
      fileName,
      storageName: uniqueFileName,
      storagePath,
      mimeType: detectedMimeType,
      fileSize,
      version: 1,
      isSigned: false,
      uploadedBy,
    })
    .returning();

  return {
    id: newAttachment.id,
    fileName: newAttachment.fileName,
    storageName: newAttachment.storageName,
    storagePath: newAttachment.storagePath,
    mimeType: newAttachment.mimeType || detectedMimeType,
    fileSize: Number(newAttachment.fileSize),
    version: newAttachment.version || 1,
  };
}

/**
 * Delete a document file
 */
export async function deleteDocumentFile(attachmentId: string): Promise<void> {
  // Get attachment record
  const [attachment] = await db
    .select()
    .from(documentAttachments)
    .where(eq(documentAttachments.id, attachmentId))
    .limit(1);

  if (!attachment) {
    throw new Error('Attachment not found');
  }

  // Delete physical file
  try {
    if (existsSync(attachment.storagePath)) {
      await unlink(attachment.storagePath);
    }
  } catch (error) {
    // Log error but continue with database deletion
    console.error('Error deleting physical file:', error);
  }

  // Delete database record
  await db.delete(documentAttachments).where(eq(documentAttachments.id, attachmentId));
}

/**
 * Get file stream for download
 */
export async function getFileStream(attachmentId: string): Promise<{
  stream: Readable;
  fileName: string;
  mimeType: string;
  fileSize: number;
}> {
  // Get attachment record
  const [attachment] = await db
    .select()
    .from(documentAttachments)
    .where(eq(documentAttachments.id, attachmentId))
    .limit(1);

  if (!attachment) {
    throw new Error('Attachment not found');
  }

  // Check if file exists
  if (!existsSync(attachment.storagePath)) {
    throw new Error('File not found on disk');
  }

  // Create read stream
  const stream = createReadStream(attachment.storagePath);

  return {
    stream,
    fileName: attachment.fileName,
    mimeType: attachment.mimeType || 'application/octet-stream',
    fileSize: Number(attachment.fileSize),
  };
}

/**
 * Get file buffer (for smaller files)
 */
export async function getFileBuffer(attachmentId: string): Promise<{
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  fileSize: number;
}> {
  // Get attachment record
  const [attachment] = await db
    .select()
    .from(documentAttachments)
    .where(eq(documentAttachments.id, attachmentId))
    .limit(1);

  if (!attachment) {
    throw new Error('Attachment not found');
  }

  // Check if file exists
  if (!existsSync(attachment.storagePath)) {
    throw new Error('File not found on disk');
  }

  // Read file
  const buffer = await readFile(attachment.storagePath);

  return {
    buffer,
    fileName: attachment.fileName,
    mimeType: attachment.mimeType || 'application/octet-stream',
    fileSize: Number(attachment.fileSize),
  };
}

/**
 * Get all attachments for a document
 */
export async function getDocumentAttachments(
  documentId: string
): Promise<(typeof documentAttachments.$inferSelect)[]> {
  const attachments = await db
    .select()
    .from(documentAttachments)
    .where(eq(documentAttachments.documentId, documentId));

  return attachments;
}


