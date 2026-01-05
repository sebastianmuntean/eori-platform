import { writeFile, mkdir } from 'fs/promises';
import { join, resolve } from 'path';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import { db } from '@/database/client';
import { messageAttachments } from '@/database/schema';
import { CHAT_CONFIG } from '@/lib/config/chat-config';

// File storage directory for chat
const UPLOAD_DIR = resolve(process.cwd(), CHAT_CONFIG.UPLOAD_DIR);

// Helper function to construct paths at runtime (prevents Turbopack static analysis)
function buildStoragePath(...segments: string[]): string {
  return join(UPLOAD_DIR, ...segments);
}

export interface UploadChatFileParams {
  conversationId: string;
  messageId: string;
  file: File | Buffer;
  fileName: string;
  mimeType?: string;
  uploadedBy: string;
}

export interface UploadChatFileResult {
  id: string;
  fileName: string;
  storageName: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
}

/**
 * Validate file type and size
 */
export function validateChatFile(file: File | { size: number; type: string }): {
  valid: boolean;
  error?: string;
} {
  // Check file size
  if (file.size > CHAT_CONFIG.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${CHAT_CONFIG.MAX_FILE_SIZE_MB}MB limit`,
    };
  }

  // Check MIME type if provided
  if (file.type && !CHAT_CONFIG.ALLOWED_MIME_TYPES.includes(file.type as any)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${CHAT_CONFIG.ALLOWED_MIME_TYPES.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Upload a chat file attachment
 */
export async function uploadChatFile(
  params: UploadChatFileParams
): Promise<UploadChatFileResult> {
  const { conversationId, messageId, file, fileName, mimeType, uploadedBy } = params;

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
  const validation = validateChatFile({
    size: fileSize,
    type: detectedMimeType,
  });

  if (!validation.valid) {
    throw new Error(validation.error || 'File validation failed');
  }

  // Generate unique filename
  const fileExtension = fileName.split('.').pop() || '';
  const uniqueFileName = `${randomUUID()}.${fileExtension}`;
  // Use runtime path builder to avoid Turbopack static analysis
  const storagePath = buildStoragePath(conversationId, uniqueFileName);

  // Ensure upload directory exists
  const uploadDir = buildStoragePath(conversationId);
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (error) {
    // Directory might already exist, continue
    if (!existsSync(uploadDir)) {
      throw new Error('Failed to create upload directory');
    }
  }

  // Save file
  await writeFile(storagePath, buffer);

  // Create attachment record
  const [newAttachment] = await db
    .insert(messageAttachments)
    .values({
      messageId,
      fileName,
      storageName: uniqueFileName,
      storagePath,
      mimeType: detectedMimeType,
      fileSize,
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
  };
}

