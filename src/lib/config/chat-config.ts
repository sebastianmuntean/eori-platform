/**
 * Chat system configuration constants
 * Centralized configuration for chat-related settings
 */

export const CHAT_CONFIG = {
  // File upload settings
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILE_SIZE_MB: 10,
  
  // Message settings
  MAX_MESSAGE_LENGTH: 10000, // Maximum characters in a message
  MAX_MESSAGE_LENGTH_DISPLAY: '10,000',
  
  // Pagination defaults
  DEFAULT_CONVERSATIONS_PAGE_SIZE: 20,
  DEFAULT_MESSAGES_PAGE_SIZE: 50,
  
  // Allowed MIME types for file uploads
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'text/csv',
  ] as const,
  
  // Upload directory
  UPLOAD_DIR: process.env.CHAT_UPLOAD_DIR || process.env.UPLOAD_DIR || 'uploads/chat',
} as const;

/**
 * Validate message content length
 */
export function validateMessageContent(content: string): {
  valid: boolean;
  error?: string;
} {
  if (content.length > CHAT_CONFIG.MAX_MESSAGE_LENGTH) {
    return {
      valid: false,
      error: `Message exceeds ${CHAT_CONFIG.MAX_MESSAGE_LENGTH_DISPLAY} character limit`,
    };
  }
  return { valid: true };
}



