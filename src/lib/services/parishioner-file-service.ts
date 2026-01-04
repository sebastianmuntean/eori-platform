import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import { validateFile } from './file-storage-service';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface UploadParishionerFileParams {
  entityId: string;
  file: File;
  uploadedBy: string;
  uploadDir: string; // 'receipts' or 'parishioner-contracts'
}

export interface UploadParishionerFileResult {
  id: string;
  fileName: string;
  storageName: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
}

/**
 * Sanitize filename to prevent path traversal
 */
function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 255)
    .trim();
}

/**
 * Upload a file for parishioner entities (receipts, contracts)
 */
export async function uploadParishionerFile(
  params: UploadParishionerFileParams
): Promise<UploadParishionerFileResult> {
  const { entityId, file, uploadedBy, uploadDir } = params;

  // Validate file
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'File validation failed');
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 10MB limit');
  }

  // Sanitize filename
  const sanitizedFileName = sanitizeFileName(file.name);

  // Generate unique filename
  const fileExtension = sanitizedFileName.split('.').pop() || '';
  const uniqueFileName = `${randomUUID()}.${fileExtension}`;
  const baseUploadDir = join(process.cwd(), 'uploads', uploadDir);
  const storagePath = join(baseUploadDir, entityId, uniqueFileName);

  // Ensure upload directory exists
  try {
    await mkdir(join(baseUploadDir, entityId), { recursive: true });
  } catch (error) {
    if (!existsSync(join(baseUploadDir, entityId))) {
      throw new Error('Failed to create upload directory');
    }
  }

  // Save file
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await writeFile(storagePath, buffer);

  return {
    id: randomUUID(), // This will be replaced by the actual DB ID
    fileName: sanitizedFileName,
    storageName: uniqueFileName,
    storagePath: storagePath,
    mimeType: file.type || 'application/octet-stream',
    fileSize: file.size,
  };
}

/**
 * Delete a file from the filesystem
 */
export async function deleteParishionerFile(storagePath: string): Promise<void> {
  try {
    if (existsSync(storagePath)) {
      await unlink(storagePath);
    }
  } catch (error) {
    // Log but don't throw - file might already be deleted
    console.error(`Failed to delete file at ${storagePath}:`, error);
  }
}

