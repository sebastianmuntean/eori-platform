/**
 * Permission validation utilities
 * Validates permission string format and provides helper functions
 */

/**
 * Permission string format: 
 * - module.action (2 parts): 'analytics.view', 'chat.view'
 * - module.resource.action (3+ parts): 'hr.employees.view', 'accounting.invoices.create'
 */
const PERMISSION_PATTERN = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/;

/**
 * Validates if a permission string matches the expected format
 * @param permission - Permission string to validate
 * @returns true if valid, false otherwise
 */
export function isValidPermissionString(permission: string): boolean {
  if (!permission || typeof permission !== 'string') {
    return false;
  }

  const trimmed = permission.trim().toLowerCase();
  
  // Allow permissions with 2+ parts (module.action or module.resource.action)
  return PERMISSION_PATTERN.test(trimmed);
}

/**
 * Sanitizes and normalizes a permission string
 * @param permission - Permission string to sanitize
 * @returns Sanitized permission string or null if invalid
 */
export function sanitizePermissionString(permission: string): string | null {
  if (!permission || typeof permission !== 'string') {
    return null;
  }

  const trimmed = permission.trim().toLowerCase();
  
  if (!isValidPermissionString(trimmed)) {
    return null;
  }

  return trimmed;
}

/**
 * Validates if a path is a safe internal redirect path
 * Prevents open redirect vulnerabilities
 * @param path - Path to validate
 * @returns true if safe, false otherwise
 */
export function isValidInternalPath(path: string): boolean {
  if (!path || typeof path !== 'string') {
    return false;
  }

  // Must start with /
  if (!path.startsWith('/')) {
    return false;
  }

  // Prevent protocol-relative URLs and external URLs
  if (path.startsWith('//') || path.includes('://')) {
    return false;
  }

  // Prevent path traversal
  if (path.includes('..')) {
    return false;
  }

  // Prevent null bytes
  if (path.includes('\0')) {
    return false;
  }

  return true;
}

