/**
 * Audit middleware for API routes
 * 
 * This middleware automatically captures request context and logs audit events
 * for CRUD operations. It can be used to wrap API route handlers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { logAuditEvent, extractIpAddress, extractUserAgent, AuditLogContext } from './audit-logger';
import { getCurrentUser } from '@/lib/auth';

/**
 * Extract resource type from endpoint path
 * e.g., /api/users -> 'user', /api/parishes -> 'parish'
 */
function extractResourceType(endpoint: string): string {
  // Remove /api prefix and get first segment
  const path = endpoint.replace(/^\/api\//, '');
  const segments = path.split('/');
  
  // Handle nested routes like /api/users/123 -> 'user'
  const resourceSegment = segments[0];
  
  // Convert plural to singular (basic)
  if (resourceSegment.endsWith('ies')) {
    return resourceSegment.slice(0, -3) + 'y'; // parishes -> parish
  } else if (resourceSegment.endsWith('s')) {
    return resourceSegment.slice(0, -1); // users -> user
  }
  
  return resourceSegment;
}

/**
 * Extract resource ID from endpoint path
 * e.g., /api/users/123 -> '123'
 */
function extractResourceId(endpoint: string): string | null {
  const path = endpoint.replace(/^\/api\//, '');
  const segments = path.split('/');
  
  // Check if there's an ID segment (usually after resource name)
  if (segments.length >= 2) {
    const potentialId = segments[1];
    // Basic UUID validation (8-4-4-4-12 format)
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(potentialId)) {
      return potentialId;
    }
  }
  
  return null;
}

/**
 * Determine audit action from HTTP method
 */
function getActionFromMethod(method: string): AuditLogContext['action'] {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'read';
    case 'POST':
      return 'create';
    case 'PUT':
    case 'PATCH':
      return 'update';
    case 'DELETE':
      return 'delete';
    default:
      return 'read';
  }
}

/**
 * Wrap an API route handler with audit logging
 * 
 * This middleware automatically logs audit events for CRUD operations.
 * It captures user context, request details, and response status.
 * 
 * @param handler - The API route handler to wrap
 * @param options - Configuration options
 */
export function withAuditLogging<T = any>(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse<T>>,
  options: {
    resourceType?: string; // Override auto-detected resource type
    skipActions?: AuditLogContext['action'][]; // Actions to skip logging
    logReads?: boolean; // Whether to log GET requests (default: false)
  } = {}
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse<T>> => {
    const method = request.method;
    const url = new URL(request.url);
    const endpoint = url.pathname;
    const action = getActionFromMethod(method);
    
    // Skip logging if action is in skip list
    if (options.skipActions?.includes(action)) {
      return handler(request, context);
    }
    
    // Skip logging reads unless explicitly enabled
    if (action === 'read' && !options.logReads) {
      return handler(request, context);
    }
    
    // Get user context (non-blocking - don't fail if auth fails)
    let userId: string | null = null;
    try {
      const { userId: currentUserId } = await getCurrentUser();
      userId = currentUserId;
    } catch (error) {
      // Auth failure is OK - we'll log with null userId
    }
    
    // Extract request context
    const ipAddress = extractIpAddress(request);
    const userAgent = extractUserAgent(request);
    const resourceType = options.resourceType || extractResourceType(endpoint);
    const resourceId = extractResourceId(endpoint);
    
    // Execute handler and capture response
    let response: NextResponse<T>;
    let error: Error | null = null;
    
    try {
      response = await handler(request, context);
    } catch (err) {
      error = err instanceof Error ? err : new Error(String(err));
      throw err;
    } finally {
      // Log audit event asynchronously (don't await to avoid blocking)
      // Only log successful operations (2xx status codes)
      if (!error && response.status >= 200 && response.status < 300) {
        logAuditEvent({
          userId,
          action,
          resourceType,
          resourceId,
          ipAddress,
          userAgent,
          requestMethod: method,
          endpoint,
          metadata: {
            statusCode: response.status,
            timestamp: new Date().toISOString(),
          },
        }).catch((auditError) => {
          // Log audit errors but don't fail the request
          console.error('Failed to log audit event:', auditError);
        });
      }
    }
    
    return response;
  };
}

/**
 * Create audit context from request for manual logging
 * 
 * Use this when you need more control over what gets logged,
 * such as logging before/after state for updates.
 */
export async function createAuditContext(
  request: NextRequest,
  options: {
    resourceType?: string;
    resourceId?: string;
    action?: AuditLogContext['action'];
  } = {}
): Promise<AuditLogContext> {
  const url = new URL(request.url);
  const endpoint = url.pathname;
  const method = request.method;
  
  // Get user context
  let userId: string | null = null;
  try {
    const { userId: currentUserId } = await getCurrentUser();
    userId = currentUserId;
  } catch (error) {
    // Auth failure is OK
  }
  
  return {
    userId,
    action: options.action || getActionFromMethod(method),
    resourceType: options.resourceType || extractResourceType(endpoint),
    resourceId: options.resourceId || extractResourceId(endpoint),
    ipAddress: extractIpAddress(request),
    userAgent: extractUserAgent(request),
    requestMethod: method,
    endpoint,
  };
}



