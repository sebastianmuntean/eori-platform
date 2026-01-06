/**
 * Audit logging service for tracking user actions
 * 
 * This service provides async audit logging with minimal performance impact.
 * Logs are written asynchronously to avoid blocking request processing.
 */

import { db } from '@/database/client';
import { auditLogs } from '@/database/schema';
import { logger } from '@/lib/utils/logger';

export type AuditAction = 'create' | 'update' | 'delete' | 'read' | 'login' | 'logout' | 'export' | 'import' | 'approve' | 'reject';

export interface AuditLogContext {
  userId?: string | null;
  action: AuditAction;
  resourceType: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestMethod?: string;
  endpoint?: string;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  } | null;
  metadata?: Record<string, any> | null;
}

/**
 * Log an audit event asynchronously
 * 
 * This function queues the audit log write to avoid blocking the request.
 * Errors are logged but do not throw to prevent audit failures from breaking functionality.
 */
export async function logAuditEvent(context: AuditLogContext): Promise<void> {
  try {
    // Validate required fields
    if (!context.action || !context.resourceType) {
      logger.warn('Invalid audit log context: missing required fields', { ...context });
      return;
    }

    // Insert audit log asynchronously
    await db.insert(auditLogs).values({
      userId: context.userId || null,
      action: context.action,
      resourceType: context.resourceType,
      resourceId: context.resourceId || null,
      ipAddress: context.ipAddress || null,
      userAgent: context.userAgent || null,
      requestMethod: context.requestMethod || null,
      endpoint: context.endpoint || null,
      changes: context.changes || null,
      metadata: context.metadata || null,
    });

    logger.debug('Audit log created', {
      action: context.action,
      resourceType: context.resourceType,
      resourceId: context.resourceId,
      userId: context.userId,
    });
  } catch (error) {
    // Log error but don't throw - audit failures shouldn't break functionality
    logger.error('Failed to create audit log', error, { context });
  }
}

/**
 * Log a create action
 */
export async function logCreate(
  userId: string | null | undefined,
  resourceType: string,
  resourceId: string,
  additionalContext?: Partial<AuditLogContext>
): Promise<void> {
  await logAuditEvent({
    userId: userId || null,
    action: 'create',
    resourceType,
    resourceId,
    ...additionalContext,
  });
}

/**
 * Log an update action with before/after state
 */
export async function logUpdate(
  userId: string | null | undefined,
  resourceType: string,
  resourceId: string,
  changes: { before: Record<string, any>; after: Record<string, any> },
  additionalContext?: Partial<AuditLogContext>
): Promise<void> {
  await logAuditEvent({
    userId: userId || null,
    action: 'update',
    resourceType,
    resourceId,
    changes,
    ...additionalContext,
  });
}

/**
 * Log a delete action
 */
export async function logDelete(
  userId: string | null | undefined,
  resourceType: string,
  resourceId: string,
  additionalContext?: Partial<AuditLogContext>
): Promise<void> {
  await logAuditEvent({
    userId: userId || null,
    action: 'delete',
    resourceType,
    resourceId,
    ...additionalContext,
  });
}

/**
 * Log a read action (for sensitive data access)
 */
export async function logRead(
  userId: string | null | undefined,
  resourceType: string,
  resourceId?: string,
  additionalContext?: Partial<AuditLogContext>
): Promise<void> {
  await logAuditEvent({
    userId: userId || null,
    action: 'read',
    resourceType,
    resourceId: resourceId || null,
    ...additionalContext,
  });
}

/**
 * Log a login action
 */
export async function logLogin(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    userId,
    action: 'login',
    resourceType: 'session',
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
  });
}

/**
 * Log a logout action
 */
export async function logLogout(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    userId,
    action: 'logout',
    resourceType: 'session',
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
  });
}

/**
 * Extract IP address from request headers
 */
export function extractIpAddress(request: Request): string | null {
  // Check various headers for IP address (for proxies/load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to connection remote address (not available in Next.js Request)
  return null;
}

/**
 * Extract user agent from request headers
 */
export function extractUserAgent(request: Request): string | null {
  return request.headers.get('user-agent') || null;
}







