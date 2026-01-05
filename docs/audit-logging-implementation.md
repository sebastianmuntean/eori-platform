# Audit Logging Implementation

## Overview

Comprehensive audit logging system has been implemented as part of Phase 1.3 of the roadmap. This system tracks all user actions for security and compliance purposes.

## Components Implemented

### 1. Database Schema

**File**: `database/schema/audit/audit_logs.ts`

- Created `audit_logs` table schema using Drizzle ORM
- Includes fields for:
  - User ID (nullable for system actions)
  - Action type (create, update, delete, read, login, logout, export, import, approve, reject)
  - Resource type and ID
  - IP address and user agent
  - Request method and endpoint
  - Changes (before/after state for updates)
  - Metadata (additional context)
  - Timestamp

### 2. Database Migration

**File**: `database/migrations/0041_create_audit_logs.sql`

- Creates `audit_logs` table with all required columns
- Creates `audit_action` enum type
- Adds indexes for common query patterns:
  - User ID
  - Action type
  - Resource type and ID
  - Created timestamp
  - Composite indexes for common filters
- Includes cleanup function for 90-day retention policy
- Adds comprehensive table and column comments

### 3. Audit Logger Service

**File**: `src/lib/audit/audit-logger.ts`

Provides async audit logging functions:
- `logAuditEvent()` - Generic audit logging function
- `logCreate()` - Log create actions
- `logUpdate()` - Log update actions with before/after state
- `logDelete()` - Log delete actions
- `logRead()` - Log read actions (for sensitive data)
- `logLogin()` - Log login events
- `logLogout()` - Log logout events
- `extractIpAddress()` - Extract IP from request headers
- `extractUserAgent()` - Extract user agent from request

**Features**:
- Async logging to avoid blocking requests
- Error handling that doesn't break functionality
- Support for before/after state tracking
- Automatic IP and user agent extraction

### 4. Audit Middleware

**File**: `src/lib/audit/audit-middleware.ts`

Provides middleware for automatic audit logging:
- `withAuditLogging()` - Wraps API route handlers with automatic audit logging
- `createAuditContext()` - Creates audit context from request for manual logging

**Features**:
- Automatic resource type detection from endpoint
- Automatic action detection from HTTP method
- Configurable options (skip actions, log reads, etc.)
- Non-blocking audit logging

### 5. Audit Log Query API

**File**: `src/app/api/audit-logs/route.ts`

REST API endpoint for querying audit logs (admin only):
- **GET /api/audit-logs** - Query audit logs with filtering, pagination, and sorting

**Query Parameters**:
- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 50)
- `userId` - Filter by user ID
- `action` - Filter by action type
- `resourceType` - Filter by resource type
- `resourceId` - Filter by resource ID
- `startDate` - Filter by start date (ISO 8601)
- `endDate` - Filter by end date (ISO 8601)
- `search` - Search in endpoint, resource type, or user agent
- `sortBy` - Sort field (created_at, action, resource_type)
- `sortOrder` - Sort order (asc, desc)

**Security**: Requires `superadmin` role

### 6. Integration Examples

Audit logging has been integrated into:

1. **Authentication Routes**:
   - `src/app/api/auth/login/route.ts` - Logs login events
   - `src/app/api/auth/logout/route.ts` - Logs logout events

2. **Users API**:
   - `src/app/api/users/route.ts` - Logs create, update, and delete operations
   - Includes before/after state for updates
   - Includes metadata for soft deletes

## Usage Examples

### Manual Audit Logging

```typescript
import { logCreate, logUpdate, logDelete } from '@/lib/audit/audit-logger';
import { extractIpAddress, extractUserAgent } from '@/lib/audit/audit-logger';

// Log a create action
await logCreate(
  userId,
  'parish',
  newParish.id,
  {
    ipAddress: extractIpAddress(request),
    userAgent: extractUserAgent(request),
    requestMethod: 'POST',
    endpoint: '/api/parishes',
  }
);

// Log an update with before/after state
await logUpdate(
  userId,
  'user',
  userId,
  {
    before: { name: 'Old Name', email: 'old@example.com' },
    after: { name: 'New Name', email: 'new@example.com' },
  },
  {
    ipAddress: extractIpAddress(request),
    userAgent: extractUserAgent(request),
    requestMethod: 'PUT',
    endpoint: '/api/users',
  }
);

// Log a delete action
await logDelete(
  userId,
  'invoice',
  invoiceId,
  {
    ipAddress: extractIpAddress(request),
    userAgent: extractUserAgent(request),
    requestMethod: 'DELETE',
    endpoint: '/api/invoices',
    metadata: { reason: 'User requested deletion' },
  }
);
```

### Using Audit Middleware

```typescript
import { withAuditLogging } from '@/lib/audit/audit-middleware';

export const GET = withAuditLogging(
  async (request: NextRequest) => {
    // Your handler code
    return NextResponse.json({ data: result });
  },
  {
    resourceType: 'parish', // Override auto-detection
    logReads: true, // Log GET requests (default: false)
    skipActions: ['read'], // Skip logging reads
  }
);
```

## Database Migration

To apply the migration:

1. Run the SQL migration file manually:
   ```bash
   psql -d your_database -f database/migrations/0041_create_audit_logs.sql
   ```

2. Or use your preferred PostgreSQL client to execute the migration.

**Note**: According to the repository rules, migrations must be run manually, not using `drizzle-kit push`.

## Retention Policy

The migration includes a cleanup function `cleanup_old_audit_logs()` that removes logs older than 90 days. This should be scheduled to run periodically (e.g., via cron job or scheduled task).

## Performance Considerations

- Audit logging is asynchronous and non-blocking
- Errors in audit logging don't break functionality
- Database indexes are optimized for common query patterns
- Logs are written in the background to minimize request latency

## Security

- Audit log query endpoint requires `superadmin` role
- Sensitive data (like passwords) should not be included in audit logs
- IP addresses and user agents are captured for security analysis
- All mutations are logged for compliance and security auditing

## Next Steps

To extend audit logging to other API routes:

1. Import audit logging functions in your route file
2. Call appropriate logging function after successful operations
3. Include before/after state for update operations
4. Use the middleware for automatic logging if appropriate

## Testing

After implementation, test:
1. Create, update, delete operations log correctly
2. Login/logout events are captured
3. Audit log query API works with filters
4. Performance impact is minimal
5. Errors in audit logging don't break functionality



