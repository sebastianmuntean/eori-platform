# Code Review: Document Redirect Notifications

## Overview

This code review evaluates the implementation of sending in-app notifications to users when a registry document is redirected to them. The implementation adds notification functionality to the `PATCH /api/registratura/general-register/[id]` endpoint.

**Files Changed:**
- `src/app/api/registratura/general-register/[id]/route.ts`

**Feature:** When a document's `solutionStatus` is set to `'redirected'` with `distributedUserIds`, notifications are sent to all assigned users.

---

## ✅ Functionality

### Working Features

- ✅ Notifications are created when `solutionStatus === 'redirected'` and users are distributed
- ✅ User IDs are validated before creating notifications (using existing `validateUserIds` function)
- ✅ Notifications include document ID, subject, and link to document detail page
- ✅ Error handling prevents notification failures from breaking document updates
- ✅ Proper logging for success and error cases

### Edge Cases Handled

- ✅ Empty user IDs array (early return)
- ✅ Notification creation errors (caught and logged, doesn't fail document update)
- ✅ Invalid user IDs are filtered out before notifications are sent

---

## 🟡 Issues and Recommendations

### 1. **Missing Locale in Notification Link** (Medium Priority)

**Location:** `src/app/api/registratura/general-register/[id]/route.ts:209`

**Issue:**
```typescript
link: `/dashboard/registry/general-register/${documentId}`,
```

The link doesn't include the locale prefix. While the `NotificationsList` component's `router.push()` can handle relative paths, it will use the current user's locale context. However, if the link is stored without locale and accessed later, it may not match the user's current locale setting.

**Current Behavior:**
- Link stored: `/dashboard/registry/general-register/{id}`
- When clicked, uses current page locale (may or may not be correct)

**Recommendation:**
The current implementation is acceptable since Next.js router handles relative paths based on current locale context. However, for consistency with the codebase pattern, consider storing locale-agnostic paths (current approach is correct).

**Alternative Consideration:**
If you want to preserve the locale at notification creation time, you'd need to:
1. Get locale from request headers or user preferences
2. Store full path: `/${locale}/dashboard/registry/general-register/${documentId}`

But this is generally not recommended as locale might change between creation and viewing.

**Status:** ✅ Current implementation is acceptable (relative paths work with Next.js router)

---

### 2. **Hardcoded Romanian Text** (High Priority)

**Location:** `src/app/api/registratura/general-register/[id]/route.ts:205-206`

**Issue:**
```typescript
title: 'Document redirectat către tine',
message: `Un document a fost redirectat către tine pentru rezolvare: "${documentSubject}"`,
```

The notification title and message are hardcoded in Romanian. This breaks internationalization support (the application supports ro, en, it based on the plan).

**Recommendation:**
Since this is a server-side API route, you have a few options:

**Option 1: Store translation keys in database (Preferred)**
Store the translation key instead of the text:
```typescript
title: 'notifications.documentRedirected.title', // Translation key
message: JSON.stringify({
  key: 'notifications.documentRedirected.message',
  params: { subject: documentSubject }
}),
```

But this requires changes to how notifications are displayed (they'd need to translate on the frontend).

**Option 2: Generate notifications on frontend (Not recommended)**
Have the frontend create notifications after redirect, but this loses server-side reliability.

**Option 3: Use user's preferred locale (Best for current architecture)**
Get the user's preferred locale from their profile and use server-side translations:

```typescript
// At the top of the function
import { getTranslations } from 'next-intl/server';

async function sendDocumentRedirectNotifications(
  documentId: string,
  documentSubject: string,
  userIds: string[],
  createdBy: string
): Promise<void> {
  // Get user locales (simplified - you'd need to fetch from user preferences)
  const userLocales = await getUserLocales(userIds);
  
  // Group users by locale for batch creation
  const notificationsByLocale = new Map<string, Array<{ userId: string }>>();
  
  for (const userId of userIds) {
    const locale = userLocales.get(userId) || 'ro'; // Default to Romanian
    if (!notificationsByLocale.has(locale)) {
      notificationsByLocale.set(locale, []);
    }
    notificationsByLocale.get(locale)!.push({ userId });
  }
  
  // Create notifications for each locale group
  for (const [locale, users] of notificationsByLocale) {
    const t = await getTranslations({ locale, namespace: 'common' });
    const notificationsToCreate = users.map(({ userId }) => ({
      userId,
      title: t('notifications.documentRedirected.title') || 'Document redirectat către tine',
      message: t('notifications.documentRedirected.message', { subject: documentSubject }) || 
               `Un document a fost redirectat către tine pentru rezolvare: "${documentSubject}"`,
      // ... rest of fields
    }));
    await db.insert(notifications).values(notificationsToCreate);
  }
}
```

**Simpler Alternative (Quick Fix):**
For now, keep Romanian as default but add a TODO comment:
```typescript
// TODO: Implement i18n support for notification messages
// Consider: Store translation keys or fetch user locale preferences
title: 'Document redirectat către tine',
message: `Un document a fost redirectat către tine pentru rezolvare: "${documentSubject}"`,
```

**Status:** ⚠️ Needs improvement for i18n support

---

### 3. **Message Length Not Validated** (Medium Priority)

**Location:** `src/app/api/registratura/general-register/[id]/route.ts:206`

**Issue:**
```typescript
message: `Un document a fost redirectat către tine pentru rezolvare: "${documentSubject}"`,
```

The `documentSubject` can be up to 500 characters (from schema: `varchar(500)`). The message prefix adds ~58 characters, so the total message could be ~558 characters. The `message` field is `text` type (unlimited), but very long messages might not display well in the UI.

**Recommendation:**
Truncate the subject if it's too long:
```typescript
const maxSubjectLength = 200; // Reasonable limit for notification message
const truncatedSubject = documentSubject.length > maxSubjectLength
  ? documentSubject.slice(0, maxSubjectLength) + '...'
  : documentSubject;

message: `Un document a fost redirectat către tine pentru rezolvare: "${truncatedSubject}"`,
```

Or better, use a helper function:
```typescript
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

message: `Un document a fost redirectat către tine pentru rezolvare: "${truncateText(documentSubject, 200)}"`,
```

**Status:** ⚠️ Should add truncation for better UX

---

### 4. **No Deduplication for Re-redirects** (Low Priority)

**Issue:**
If a document is redirected multiple times to the same users, multiple notifications will be created. This could lead to notification spam.

**Current Behavior:**
- Document redirected to User A → Notification 1 created
- Same document redirected again to User A → Notification 2 created
- User A receives duplicate notifications

**Recommendation:**
This is generally acceptable behavior - users should be notified each time a document is redirected to them. However, if you want to prevent duplicates, you could:

**Option 1: Check for existing unread notifications**
```typescript
// Before creating notifications, check for existing unread ones
const existingNotifications = await db
  .select({ id: notifications.id })
  .from(notifications)
  .where(
    and(
      eq(notifications.module, 'registratura'),
      eq(notifications.isRead, false),
      inArray(notifications.userId, userIds),
      eq(notifications.link, `/dashboard/registry/general-register/${documentId}`)
    )
  );

const existingUserIds = new Set(existingNotifications.map(n => n.userId));
const newUserIds = userIds.filter(id => !existingUserIds.has(id));

// Only create notifications for users who don't have unread ones
if (newUserIds.length > 0) {
  // ... create notifications
}
```

**Option 2: Mark existing notifications as read before creating new ones**
```typescript
// Mark existing notifications for this document as read
await db
  .update(notifications)
  .set({ isRead: true, readAt: new Date() })
  .where(
    and(
      eq(notifications.module, 'registratura'),
      eq(notifications.isRead, false),
      inArray(notifications.userId, userIds),
      eq(notifications.link, `/dashboard/registry/general-register/${documentId}`)
    )
  );
```

**Status:** ✅ Current behavior is acceptable (notifications for each redirect action)

---

### 5. **Missing Transaction Wrapper** (Low Priority)

**Issue:**
The notification creation is not wrapped in the same transaction as the document update. If notifications fail after the document is updated, you have an inconsistent state (document is redirected but users aren't notified).

**Current Behavior:**
- Document update succeeds ✅
- Notification creation fails ❌
- Document shows as redirected but users weren't notified

**Recommendation:**
The current error handling (catch and log, don't fail) is intentional and appropriate. Notifications are secondary to document updates. However, if you want stronger consistency:

```typescript
// Wrap in transaction (if your DB client supports it)
await db.transaction(async (tx) => {
  // Update document
  const [updatedDocument] = await tx.update(generalRegister)...;
  
  // Create workflow steps
  await tx.insert(generalRegisterWorkflow)...
  
  // Create notifications
  await tx.insert(notifications)...
});
```

But this means if notifications fail, the entire document update rolls back, which might not be desired.

**Status:** ✅ Current approach is acceptable (notifications are non-critical)

---

### 6. **XSS Potential in Message** (Low Priority - Database Level Safe)

**Issue:**
The `documentSubject` is inserted directly into the message string. While this is safe at the database level (it's stored as-is), if the frontend displays it without proper escaping, there could be XSS issues.

**Current Behavior:**
- Subject stored: `Hello <script>alert('xss')</script>`
- Message: `Un document a fost redirectat...: "Hello <script>alert('xss')</script>"`

**Recommendation:**
The database stores the raw string, which is correct. The frontend components (`NotificationsList`, `NotificationModal`) should sanitize HTML when displaying. Verify that React's default escaping is being used (it should be, as long as you're not using `dangerouslySetInnerHTML`).

**Status:** ✅ Safe if frontend properly escapes (which React does by default)

---

## 🔒 Security Review

### ✅ Security Strengths

1. **User ID Validation**: User IDs are validated before creating notifications
2. **Authentication Required**: All operations require authentication via `getCurrentUser()`
3. **UUID Validation**: Schema validation ensures valid UUIDs
4. **SQL Injection Safe**: Using Drizzle ORM with parameterized queries
5. **Error Handling**: Errors are logged but don't expose sensitive information

### ⚠️ Security Considerations

1. **Link Construction**: Document ID comes from URL params but is validated (document must exist). Safe.
2. **User Enumeration**: Failed notification creation doesn't leak which users exist (good).
3. **Rate Limiting**: No rate limiting on notification creation. If someone redirects a document to 1000 users, 1000 notifications are created. Consider adding a batch limit check.

**Recommendation for Rate Limiting:**
```typescript
const MAX_NOTIFICATION_BATCH = 100; // Or use existing MAX_BATCH_SIZE from notifications API

if (userIds.length > MAX_NOTIFICATION_BATCH) {
  console.warn(`⚠️ Too many users for notification batch: ${userIds.length}`);
  // Option 1: Truncate
  userIds = userIds.slice(0, MAX_NOTIFICATION_BATCH);
  // Option 2: Return error (if this should never happen)
  // throw new Error(`Cannot send notifications to more than ${MAX_NOTIFICATION_BATCH} users`);
}
```

---

## 📊 Code Quality Assessment

### ✅ Strengths

1. **Clear Function Separation**: `sendDocumentRedirectNotifications` is well-isolated
2. **Good Error Handling**: Try-catch with logging, non-blocking failures
3. **Follows Existing Patterns**: Similar structure to other notification services
4. **Proper Logging**: Success and error cases are logged
5. **Type Safety**: Uses TypeScript types correctly

### ⚠️ Areas for Improvement

1. **Function Documentation**: Add JSDoc with parameter descriptions
2. **Constants**: Extract magic strings to constants
3. **Return Value**: Function returns `Promise<void>`, but might want to return success/failure status

**Suggested Improvements:**

```typescript
/**
 * Send notifications to users when a document is redirected to them
 * 
 * @param documentId - The ID of the document being redirected
 * @param documentSubject - The subject/title of the document (will be truncated if too long)
 * @param userIds - Array of user IDs to notify (must be valid UUIDs)
 * @param createdBy - User ID of the person redirecting the document
 * @returns Promise that resolves to the number of notifications created, or 0 if none
 */
async function sendDocumentRedirectNotifications(
  documentId: string,
  documentSubject: string,
  userIds: string[],
  createdBy: string
): Promise<number> {
  // ... implementation
  return notificationsToCreate.length;
}
```

---

## 🧪 Testing Recommendations

### Test Cases to Consider

1. **Happy Path**: Document redirected with valid user IDs → Notifications created
2. **Empty Users**: Document redirected with empty array → No notifications, no error
3. **Invalid User IDs**: Some invalid IDs → Invalid ones filtered, valid ones notified
4. **All Invalid User IDs**: All invalid → No notifications created, document still updated
5. **Long Subject**: Subject > 200 chars → Truncated in message
6. **Database Error**: DB failure during notification insert → Document still updated, error logged
7. **Multiple Redirects**: Same document redirected twice → Two notifications created
8. **Very Large Batch**: 150 users → Consider rate limiting

### Manual Testing Steps

1. Create/update a document, set `solutionStatus: 'redirected'` with `distributedUserIds: [validUserId]`
2. Verify notification appears in header badge
3. Verify notification can be clicked and navigates to document
4. Verify notification message includes document subject
5. Test with invalid user IDs (should filter them out)
6. Test with very long subject (> 200 chars)

---

## 📝 Summary

### Overall Assessment: ✅ **APPROVED with Recommendations**

The implementation is functionally correct and follows good practices. The main concerns are:

1. **High Priority**: Internationalization - hardcoded Romanian text
2. **Medium Priority**: Message truncation for long subjects
3. **Low Priority**: Consider rate limiting for large batches

### Recommended Action Items

1. ✅ **Immediate**: Add message truncation for document subject
2. ⚠️ **Soon**: Implement i18n for notification messages (or add TODO with plan)
3. 📋 **Future**: Consider rate limiting for notification batches
4. 📋 **Future**: Add JSDoc documentation to function

### Code Quality Score: 8/10

- Functionality: 9/10 (works correctly, handles edge cases)
- Security: 9/10 (safe, minor rate limiting consideration)
- Maintainability: 7/10 (hardcoded text reduces maintainability)
- Testing: 8/10 (would benefit from unit tests)

---

## ✅ Approval Status

**Status:** ✅ **APPROVED** - Code is production-ready with the understanding that i18n improvements should be prioritized soon.

The implementation correctly fulfills the requirement: "When redirecting a registry document send a notification to the users which have to solve it."

Suggested follow-up: Create a ticket for i18n support and message truncation improvements.


