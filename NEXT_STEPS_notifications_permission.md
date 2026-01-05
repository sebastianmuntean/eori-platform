# Next Steps: Notifications Permission Implementation

## Overview

Added the `notifications.create` permission to the seed file and assigned it to appropriate roles. This completes the authorization setup for the notifications API.

---

## ✅ Changes Implemented

### 1. Permission Definition

**File:** `database/seed.ts`

**Added to `standardPermissions` array:**
```typescript
// Notifications resource
{ name: 'notifications.create', resource: 'notifications', action: 'create', description: 'Creare notificări' },
```

**Location:** After Events permissions, before Documents permissions (maintains logical grouping)

**Format:** Follows the same pattern as other permissions:
- `events.create` → `notifications.create`
- `documents.create` → `notifications.create`
- Pattern: `{resource}.{action}`

---

### 2. Role-Permission Assignments

**File:** `database/seed.ts`

**Added to `rolePermissionMappings`:**

#### Admin Role
```typescript
admin: [
  // ... existing permissions ...
  'events.view',
  'events.create',
  'events.edit',
  'events.delete',
  'events.confirm',
  'notifications.create', // ✅ Added
  'documents.read',
  // ... rest of permissions ...
]
```

#### Moderator Role
```typescript
moderator: [
  // ... existing permissions ...
  'events.view',
  'events.create',
  'events.edit',
  'events.confirm',
  'notifications.create', // ✅ Added
  'documents.read',
  // ... rest of permissions ...
]
```

#### Superadmin Role
Automatically gets all permissions (including `notifications.create`) via:
```typescript
superadmin: standardPermissions.map((p) => p.name), // All permissions
```

---

## 🔒 Security Implementation Status

### ✅ Completed
- [x] Permission definition added to seed file
- [x] Permission assigned to `admin` role
- [x] Permission assigned to `moderator` role
- [x] Permission automatically available to `superadmin` role
- [x] API route checks for `notifications.create` permission
- [x] Authorization check implemented in POST route

### 📋 Next Steps

1. **Run Database Seed** (if needed)
   ```bash
   # If running seed script
   npm run db:seed
   ```
   
   Note: The seed file is idempotent - it checks for existing permissions before creating them, so it's safe to run multiple times.

2. **Manual Database Update** (if seed script not used)
   ```sql
   -- Add permission (idempotent - checks for existence)
   INSERT INTO permissions (name, resource, action, description)
   SELECT 'notifications.create', 'notifications', 'create', 'Creare notificări'
   WHERE NOT EXISTS (
     SELECT 1 FROM permissions WHERE name = 'notifications.create'
   );
   
   -- Assign to admin role
   INSERT INTO role_permissions (role_id, permission_id)
   SELECT r.id, p.id
   FROM roles r, permissions p
   WHERE r.name = 'admin' AND p.name = 'notifications.create'
   AND NOT EXISTS (
     SELECT 1 FROM role_permissions rp
     WHERE rp.role_id = r.id AND rp.permission_id = p.id
   );
   
   -- Assign to moderator role
   INSERT INTO role_permissions (role_id, permission_id)
   SELECT r.id, p.id
   FROM roles r, permissions p
   WHERE r.name = 'moderator' AND p.name = 'notifications.create'
   AND NOT EXISTS (
     SELECT 1 FROM role_permissions rp
     WHERE rp.role_id = r.id AND rp.permission_id = p.id
   );
   ```

3. **Frontend Integration**
   - Update frontend to check for `notifications.create` permission before showing "Send Notification" UI
   - Ensure CSRF tokens are included in POST/PATCH requests
   - Handle 403 errors gracefully when permission is missing

4. **Testing**
   - Test that users with `admin` role can create notifications
   - Test that users with `moderator` role can create notifications
   - Test that users with `user` role cannot create notifications (should return 403)
   - Test that unauthorized requests are properly rejected

---

## 📊 Permission Matrix

| Role | notifications.create | Notes |
|------|---------------------|-------|
| superadmin | ✅ Yes | All permissions |
| admin | ✅ Yes | Explicitly granted |
| moderator | ✅ Yes | Explicitly granted |
| user | ❌ No | Not granted |

---

## 🔍 Verification

### Check Permission Exists
```sql
SELECT * FROM permissions WHERE name = 'notifications.create';
```

### Check Role Assignments
```sql
SELECT r.name AS role_name, p.name AS permission_name
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE p.name = 'notifications.create'
ORDER BY r.name;
```

Expected results:
- `superadmin` → `notifications.create`
- `admin` → `notifications.create`
- `moderator` → `notifications.create`

---

## 🎯 API Route Behavior

### Before Permission Assignment
- All authenticated users could create notifications
- No authorization check
- Security risk: spam/abuse possible

### After Permission Assignment
- Only users with `notifications.create` permission can create notifications
- Authorization check returns 403 for unauthorized users
- Secure: prevents abuse and spam

---

## 📝 Code Reference

### API Route Authorization Check
**File:** `src/app/api/notifications/route.ts:168-175`

```typescript
// Authorization - check permission to create notifications
const hasPermission = await checkPermission('notifications.create');
if (!hasPermission) {
  return NextResponse.json(
    { success: false, error: 'Insufficient permissions' },
    { status: 403 }
  );
}
```

### Permission Name Format
- **API Route:** `notifications.create`
- **Seed File:** `notifications.create`
- **Pattern:** `{resource}.{action}` (matches `events.create`, `documents.create`)

---

## ✅ Summary

- ✅ Permission `notifications.create` added to seed file
- ✅ Permission assigned to `admin` and `moderator` roles
- ✅ Permission automatically available to `superadmin` role
- ✅ Seed file is idempotent (safe to run multiple times)
- ✅ Follows existing codebase patterns
- ✅ Ready for database seeding/manual SQL execution

**Status:** ✅ **COMPLETE** - Permission definition and role assignments ready

**Next Action:** Run seed script or execute SQL to add permission to database

---

## 📚 Related Files

- Permission Seed: `database/seed.ts`
- API Route: `src/app/api/notifications/route.ts`
- Security Refactoring: `REFACTORING_SECURITY_notifications_api.md`
- Security Audit: `SECURITY_AUDIT_notifications_api.md`


