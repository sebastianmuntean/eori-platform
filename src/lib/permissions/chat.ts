/**
 * Chat module permission constants
 * 
 * These permissions follow the pattern: chat.{resource}.{action}
 * All permissions are defined in the database migration
 */

export const CHAT_PERMISSIONS = {
  // Chat (general)
  VIEW: 'chat.view',
  SEND: 'chat.send',
  MANAGE: 'chat.manage',

  // Files
  FILES_UPLOAD: 'chat.files.upload',
  FILES_DOWNLOAD: 'chat.files.download',
} as const;

export type ChatPermission = typeof CHAT_PERMISSIONS[keyof typeof CHAT_PERMISSIONS];

/**
 * Helper function to check if a permission string is a valid Chat permission
 */
export function isChatPermission(permission: string): permission is ChatPermission {
  return Object.values(CHAT_PERMISSIONS).includes(permission as ChatPermission);
}

/**
 * Get all Chat permissions as an array
 */
export function getAllChatPermissions(): ChatPermission[] {
  return Object.values(CHAT_PERMISSIONS);
}

/**
 * Permission groups for easier management
 */
export const CHAT_PERMISSION_GROUPS = {
  chat: [
    CHAT_PERMISSIONS.VIEW,
    CHAT_PERMISSIONS.SEND,
    CHAT_PERMISSIONS.MANAGE,
  ],
  files: [
    CHAT_PERMISSIONS.FILES_UPLOAD,
    CHAT_PERMISSIONS.FILES_DOWNLOAD,
  ],
} as const;


