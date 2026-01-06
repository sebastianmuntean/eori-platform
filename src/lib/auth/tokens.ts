import { randomBytes } from 'crypto';

/**
 * Generate a secure verification token
 * Returns a 64-character hex string (32 bytes)
 * Note: Database schema should support at least 255 characters for verification_code
 */
export function generateVerificationToken(): string {
  return randomBytes(32).toString('hex');
}







