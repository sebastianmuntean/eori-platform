# Code Review: Document Status Workflow Redesign

## Overview

**Review Date**: 2024  
**Feature**: Redesign workflow-ului de creare și gestionare a documentelor în registrul general  
**Scope**: Database schema, API endpoints, React components, TypeScript types

## Review Checklist

### Functionality

- [x] Intended behavior works and matches requirements
- [⚠️] Edge cases handled gracefully (see issues below)
- [⚠️] Error handling is appropriate and informative (see issues below)

### Code Quality

- [x] Code structure is clear and maintainable
- [⚠️] No unnecessary duplication or dead code (see issues below)
- [⚠️] Tests/documentation updated as needed (see recommendations)

### Security & Safety

- [x] No obvious security vulnerabilities introduced
- [⚠️] Inputs validated and outputs sanitized (see issues below)
- [x] Sensitive data handled correctly

---

## ✅ Strengths

1. **Well-structured implementation**: Follows existing patterns and maintains consistency
2. **Type safety**: Proper TypeScript types throughout
3. **Status calculation logic**: Clear and well-documented automatic status calculation
4. **Component separation**: Good separation between form components and detail pages
5. **User experience**: Conditional rendering for user selection based on solution status

---

## 🔴 Critical Issues

### 1. **Database Enum Still Contains Removed Statuses**

**Location**: `database/schema/register/enums.ts:10`

**Issue**: The `documentStatusEnum` still contains `'registered'` and `'archived'` which should have been removed according to the plan.

**Current Code**:
```typescript
export const documentStatusEnum = pgEnum('document_status', ['draft', 'registered', 'in_work', 'distributed', 'resolved', 'archived', 'cancelled']);
```

**Expected**:
```typescript
export const documentStatusEnum = pgEnum('document_status', ['draft', 'in_work', 'distributed', 'resolved', 'cancelled']);
```

**Impact**: 
- TypeScript types are correct (only valid statuses), but database enum doesn't match
- Could cause runtime errors if old status values exist in database
- Inconsistency between schema and implementation

**Recommendation**: 
- Create migration to remove these values from PostgreSQL enum
- Update schema file to match

---

### 2. **Detail Page Not Calling API Endpoint**

**Location**: `src/app/[locale]/dashboard/registry/general-register/[id]/page.tsx:68`

**Issue**: The `handleSave` function has a TODO comment and doesn't actually call the PATCH API endpoint that was implemented.

**Current Code**:
```typescript
const handleSave = useCallback(async (data: {
  // ... data structure
}) => {
  if (!document) return;
  
  setSaving(true);
  try {
    // TODO: Implement API endpoint for updating document
    // For now, just show success and redirect to list
    success(tReg('documentUpdated') || 'Document actualizat cu succes');
    // Redirect to list page after successful save
    router.push(`/${locale}/dashboard/registry/general-register`);
  } catch (err) {
    // ...
  }
}, [document, router, locale, success, showError, tReg]);
```

**Impact**: 
- Form submission doesn't actually save data to database
- Users see success message but changes are lost
- Critical functionality broken

**Recommendation**: Implement actual API call:
```typescript
const handleSave = useCallback(async (data: {
  subject: string;
  description?: string | null;
  solutionStatus: 'approved' | 'rejected' | 'redirected' | null;
  distributedUserIds: string[];
  dueDate?: string | null;
  notes?: string | null;
}) => {
  if (!document) return;
  
  setSaving(true);
  try {
    const response = await fetch(`/api/registratura/general-register/${document.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Eroare la actualizarea documentului');
    }

    success(tReg('documentUpdated') || 'Document actualizat cu succes');
    // Refresh document data
    await fetchDocument();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : tReg('errors.failedToUpdate') || 'Eroare la actualizarea documentului';
    showError(errorMessage);
  } finally {
    setSaving(false);
  }
}, [document, fetchDocument, success, showError, tReg]);
```

---

### 3. **Missing Migration File for dueDate**

**Location**: Plan mentions `database/migrations/0047_add_due_date_to_general_register.sql`

**Issue**: Migration file doesn't exist, but schema has been updated.

**Impact**: 
- Database schema and code are out of sync
- New deployments will fail if database doesn't have `due_date` column
- Existing databases won't have the column

**Recommendation**: Create migration file:
```sql
-- Migration: Add due_date column to general_register table

ALTER TABLE "general_register" 
ADD COLUMN IF NOT EXISTS "due_date" date;
```

---

## 🟡 Medium Priority Issues

### 4. **Missing dueDate in GeneralRegisterDocument Interface**

**Location**: `src/hooks/useGeneralRegister.ts:8-27`

**Issue**: The `GeneralRegisterDocument` interface doesn't include `dueDate` field, but it's used in the form and API.

**Current Code**:
```typescript
export interface GeneralRegisterDocument {
  id: string;
  // ... other fields
  description: string | null;
  filePath: string | null;
  status: GeneralRegisterDocumentStatus;
  // ... no dueDate field
}
```

**Impact**: 
- TypeScript errors when accessing `document.dueDate`
- Type casting needed: `(document as any).dueDate` (seen in detail page line 133)

**Recommendation**: Add field to interface:
```typescript
export interface GeneralRegisterDocument {
  // ... existing fields
  description: string | null;
  dueDate: string | null;  // Add this
  filePath: string | null;
  status: GeneralRegisterDocumentStatus;
  // ...
}
```

---

### 5. **Inconsistent Status Validation in API**

**Location**: `src/app/api/registratura/general-register/[id]/route.ts:64`

**Issue**: The `DocumentStatus` type is defined locally but should use the shared type from the enum.

**Current Code**:
```typescript
type DocumentStatus = 'draft' | 'in_work' | 'distributed' | 'resolved' | 'cancelled';
```

**Impact**: 
- Duplication of type definition
- Risk of inconsistency if statuses change

**Recommendation**: Import from shared location:
```typescript
import { DocumentStatus } from '@/lib/services/general-register-workflow-service';
// or
import type { GeneralRegisterDocumentStatus } from '@/hooks/useGeneralRegister';
```

---

### 6. **Default Due Date Logic Issue**

**Location**: `src/components/registratura/GeneralRegisterEditForm.tsx:37-44, 50`

**Issue**: Default due date is always set to today + 30 days, even when editing existing documents that might already have a due date.

**Current Code**:
```typescript
const getDefaultDueDate = (): string => {
  const today = new Date();
  const dueDate = new Date(today);
  dueDate.setDate(today.getDate() + 30);
  return dueDate.toISOString().split('T')[0];
};

const [formData, setFormData] = useState({
  // ...
  dueDate: initialData?.dueDate || getDefaultDueDate(),
});
```

**Impact**: 
- Existing documents lose their due date when form loads
- Default is applied even when document has no due date (should be null/empty)

**Recommendation**: Only set default if no initial data:
```typescript
const [formData, setFormData] = useState({
  // ...
  dueDate: initialData?.dueDate || null,  // Don't set default for existing docs
});
```

And handle default in the form display:
```typescript
<Input
  label="Termen"
  type="date"
  value={formData.dueDate || ''}  // Empty string for date input when null
  onChange={(e) => handleFieldChange('dueDate', e.target.value || null)}
/>
```

---

### 7. **Missing Validation for Date Format**

**Location**: `src/app/api/registratura/general-register/[id]/route.ts:60, 269-270`

**Issue**: `dueDate` is validated as optional string but not validated for date format.

**Current Code**:
```typescript
dueDate: z.string().optional().nullable(),
// ...
if (data.dueDate !== undefined) {
  updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
}
```

**Impact**: 
- Invalid date strings could cause errors
- No validation that date is in correct format (YYYY-MM-DD)

**Recommendation**: Add date format validation:
```typescript
dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional().nullable(),
```

---

### 8. **Workflow Step Creation Logic Issue**

**Location**: `src/app/api/registratura/general-register/[id]/route.ts:287-320`

**Issue**: The logic for creating workflow steps only creates them on first save, but resolution steps are created separately. This could lead to inconsistent workflow state.

**Current Code**:
```typescript
// Only create workflow steps if this is the first save (no existing steps)
if (existingSteps.length === 0) {
  // Create creator workflow step
  await createCreatorWorkflowStep(...);
  
  // Create distribution workflow steps if users are distributed
  if (validUserIds.length > 0) {
    await createDistributionWorkflowSteps(...);
  }
} else if (data.solutionStatus === 'approved' || data.solutionStatus === 'rejected') {
  // If workflow steps exist and we're resolving, create resolution step
  await createResolutionWorkflowStep(...);
}
```

**Impact**: 
- If user saves without solution, then later adds solution, resolution step is created
- But if user saves with solution first time, resolution is in creator step
- Inconsistent workflow structure

**Recommendation**: Clarify the logic:
- If solution is provided on first save, create resolution step instead of creator step
- If solution is provided on subsequent save, create new resolution step

---

## 🟢 Low Priority / Recommendations

### 9. **Missing Error Handling for File Upload**

**Location**: `src/components/registratura/GeneralRegisterEditForm.tsx`

**Issue**: The form mentions file upload in the plan, but there's no file upload field in the form. Files are handled separately via `GeneralRegisterAttachments` component.

**Impact**: 
- Plan mentions file upload in form, but it's implemented separately
- Could be confusing for users

**Recommendation**: 
- Either add file upload to form, or update plan/documentation
- Current implementation (separate attachments section) is actually better UX

---

### 10. **Missing Notes Field in Database Schema**

**Location**: `database/schema/register/general_register.ts`

**Issue**: The form has a `notes` field, but it's not clear where it's stored. It might be stored in workflow steps, not in the document itself.

**Impact**: 
- Notes are passed to workflow steps, not stored on document
- If user wants to see notes later, they need to check workflow

**Recommendation**: 
- Clarify if notes should be on document or only in workflow
- If on document, add `notes` field to schema

---

### 11. **Type Safety for Solution Status**

**Location**: `src/components/registratura/GeneralRegisterEditForm.tsx:49, 254`

**Issue**: Solution status type casting could be safer.

**Current Code**:
```typescript
solutionStatus: value ? (value as 'approved' | 'rejected' | 'redirected') : null
```

**Recommendation**: Use type guard or validation:
```typescript
const isValidSolutionStatus = (val: string): val is 'approved' | 'rejected' | 'redirected' => {
  return ['approved', 'rejected', 'redirected'].includes(val);
};

// Then use:
solutionStatus: value && isValidSolutionStatus(value) ? value : null
```

---

### 12. **Missing Loading State in Detail Page**

**Location**: `src/app/[locale]/dashboard/registry/general-register/[id]/page.tsx`

**Issue**: When saving, the form shows loading, but the page doesn't prevent navigation or show global loading state.

**Recommendation**: Add loading overlay or disable navigation during save.

---

## Summary

### Must Fix Before Merge

1. ✅ Remove `'registered'` and `'archived'` from database enum schema
2. ✅ Implement actual API call in detail page `handleSave`
3. ✅ Create migration file for `dueDate` column
4. ✅ Add `dueDate` to `GeneralRegisterDocument` interface

### Should Fix Soon

5. Fix default due date logic for existing documents
6. Add date format validation in API
7. Clarify workflow step creation logic
8. Use shared types instead of local definitions

### Nice to Have

9. Improve type safety for solution status
10. Add loading states
11. Clarify notes storage location

---

## Testing Recommendations

1. **Test status transitions**: Verify all status calculation scenarios work correctly
2. **Test workflow steps**: Ensure steps are created correctly on first save and subsequent saves
3. **Test date handling**: Verify dueDate is saved and loaded correctly
4. **Test user distribution**: Verify distributed users receive workflow steps
5. **Test error cases**: Invalid dates, missing users, network errors
6. **Test edge cases**: Empty solution status, no distributed users, etc.

---

## Architecture Notes

The implementation follows a good separation of concerns:
- **Schema layer**: Database definitions
- **Service layer**: Business logic (status calculation)
- **API layer**: Request handling and validation
- **Component layer**: UI and user interaction

The automatic status calculation is well-designed and follows the requirements. The workflow step creation logic could be clearer, but the overall approach is sound.






