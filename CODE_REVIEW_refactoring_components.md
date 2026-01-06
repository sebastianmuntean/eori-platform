# Code Review: Component Refactoring (Suppliers & Weddings)

## Overview
This review covers the refactoring work that extracted modals and card components from the Suppliers and Weddings pages into reusable components, following the pattern established in the Funerals page.

## Review Checklist

### ✅ Functionality
- [x] Intended behavior works and matches requirements
- [x] Edge cases handled gracefully
- [x] Error handling is appropriate and informative

### ⚠️ Code Quality
- [x] Code structure is clear and maintainable
- [ ] No unnecessary duplication or dead code
- [ ] Tests/documentation updated as needed

### ✅ Security & Safety
- [x] No obvious security vulnerabilities introduced
- [x] Inputs validated and outputs sanitized
- [x] Sensitive data handled correctly

---

## Issues Found

### 🔴 Critical Issues

#### 1. **Suppliers Page - Duplicate Column Keys**
**File:** `src/app/[locale]/dashboard/accounting/suppliers/page.tsx`  
**Lines:** 183-234

**Problem:**
```typescript
const columns = useMemo(() => [
  { key: 'code' as keyof Client, label: t('code'), sortable: true },
  {
    key: 'code' as keyof Client,  // ❌ Duplicate key
    label: t('name'),
    sortable: true,
    render: (_: any, row: Client) => getClientDisplayName(row),
  },
  {
    key: 'code' as keyof Client,  // ❌ Duplicate key
    label: t('type'),
    // ...
  },
  // ...
]);
```

**Impact:** This will cause React key conflicts and may break table rendering. The `key` should uniquely identify each column.

**Fix:**
```typescript
const columns = useMemo(() => [
  { key: 'code' as keyof Client, label: t('code'), sortable: true },
  {
    key: 'name' as keyof Client,  // ✅ Use 'name' or create a unique identifier
    label: t('name'),
    sortable: true,
    render: (_: any, row: Client) => getClientDisplayName(row),
  },
  {
    key: 'type' as keyof Client,  // ✅ Use 'type' or create a unique identifier
    label: t('type'),
    // ...
  },
]);
```

---

### 🟡 Medium Priority Issues

#### 2. **SuppliersFiltersCard - Inconsistent Card Structure**
**File:** `src/components/accounting/suppliers/SuppliersFiltersCard.tsx`  
**Lines:** 26-40

**Problem:**
Uses `CardHeader` but should use `CardBody` to match the pattern from `FuneralsFiltersCard`.

**Current:**
```typescript
<Card>
  <CardHeader>
    <div className="flex items-center gap-4 mb-4">
      <SearchInput ... />
    </div>
    <FilterGrid>
      <FilterClear onClear={onClearFilters} />
    </FilterGrid>
  </CardHeader>
</Card>
```

**Expected (matching FuneralsFiltersCard):**
```typescript
<Card variant="outlined" className="mb-6">
  <CardBody>
    <div className="flex items-center gap-4 mb-4">
      <SearchInput ... />
    </div>
    <FilterGrid>
      <FilterClear onClear={onClearFilters} />
    </FilterGrid>
  </CardBody>
</Card>
```

**Impact:** Inconsistent UI structure across similar components.

---

#### 3. **SuppliersTableCard - Inconsistent Error Styling**
**File:** `src/components/accounting/suppliers/SuppliersTableCard.tsx`  
**Line:** 44

**Problem:**
Uses inline `text-red-500` instead of the consistent error styling pattern.

**Current:**
```typescript
{error && <div className="text-red-500 mb-4">{error}</div>}
```

**Expected (matching FuneralsTableCard):**
```typescript
{error && (
  <div className="mb-4 p-4 bg-danger/10 text-danger rounded-md">
    {error}
  </div>
)}
```

**Impact:** Inconsistent error display styling.

---

#### 4. **Weddings Page - Unused Function**
**File:** `src/app/[locale]/dashboard/events/weddings/page.tsx`  
**Lines:** 167-170

**Problem:**
`getParishName` function is defined but never used.

```typescript
const getParishName = (parishId: string) => {
  const parish = parishes.find((p) => p.id === parishId);
  return parish ? parish.name : parishId;
};
```

**Impact:** Dead code that should be removed.

**Fix:** Remove the unused function.

---

#### 5. **Weddings Page - Missing Dependencies in useMemo**
**File:** `src/app/[locale]/dashboard/events/weddings/page.tsx`  
**Lines:** 177-227

**Problem:**
The `columns` useMemo is missing dependencies for `handleEdit`, `handleConfirm`, and `handleCancel`.

**Current:**
```typescript
const columns = useMemo(() => [
  // ...
  render: (_: any, row: ChurchEvent) => (
    <Dropdown
      items={[
        { label: t('edit'), onClick: () => handleEdit(row) },
        ...(row.status === 'pending' ? [{ label: t('confirm'), onClick: () => handleConfirm(row.id) }] : []),
        ...(row.status !== 'cancelled' && row.status !== 'completed' ? [{ label: t('cancel'), onClick: () => handleCancel(row.id), variant: 'danger' as const }] : []),
        // ...
      ]}
    />
  ),
], [t, formatDate]);  // ❌ Missing handleEdit, handleConfirm, handleCancel
```

**Fix:**
```typescript
], [t, formatDate, handleEdit, handleConfirm, handleCancel]);
```

**Impact:** React Hook dependency warnings and potential stale closures.

---

### 🟢 Low Priority / Suggestions

#### 6. **WeddingAddModal - Missing Status Field**
**File:** `src/components/events/WeddingAddModal.tsx`

**Note:** This is intentional (matches FuneralAddModal pattern), but consider if status should be set to 'pending' by default in the form data initialization.

**Current:** Status is not shown in add modal (only in edit modal).

**Suggestion:** This is fine if it matches the business logic, but document why status is hidden in add mode.

---

#### 7. **Type Safety - `any[]` for Columns**
**Files:** Multiple table card components

**Problem:**
```typescript
columns: any[];
```

**Suggestion:** Create a proper type for table columns:
```typescript
type TableColumn<T> = {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
};
```

---

#### 8. **Suppliers Page - Missing Loading State in Delete Dialog**
**File:** `src/app/[locale]/dashboard/accounting/suppliers/page.tsx`  
**Line:** 326

**Current:**
```typescript
<DeleteSupplierDialog
  isLoading={loading}  // This is general loading, not delete-specific
  // ...
/>
```

**Suggestion:** Consider adding a separate `isDeleting` state for better UX.

---

## Positive Aspects

### ✅ Good Practices

1. **Consistent Component Structure**
   - All modals follow the same pattern (Add/Edit/Delete)
   - Card components are well-structured and reusable

2. **Type Safety**
   - Good use of TypeScript interfaces
   - Proper type exports (e.g., `WeddingFormData`)

3. **Code Reusability**
   - Smart reuse of `FuneralFormData` for weddings
   - Shared `DeleteEventDialog` for events

4. **Separation of Concerns**
   - Business logic stays in pages
   - UI components are pure and focused

5. **Documentation**
   - Good JSDoc comments on components
   - Clear prop interfaces

6. **Error Handling**
   - Proper error states in table cards
   - Toast notifications for user feedback

---

## Recommendations

### Immediate Actions Required

1. **Fix duplicate column keys** in Suppliers page (Critical)
2. **Fix SuppliersFiltersCard structure** to match pattern (Medium)
3. **Fix SuppliersTableCard error styling** for consistency (Medium)
4. **Remove unused `getParishName`** function from Weddings page (Medium)
5. **Add missing dependencies** to useMemo in Weddings page (Medium)

### Future Improvements

1. **Create shared types** for table columns across the codebase
2. **Extract common filter card logic** into a base component
3. **Add unit tests** for the new components
4. **Consider creating a generic EventFiltersCard** that can be shared between Funerals, Weddings, and Baptisms
5. **Add loading states** for individual operations (delete, update, etc.)

---

## Testing Recommendations

1. **Manual Testing:**
   - Test add/edit/delete flows for both Suppliers and Weddings
   - Verify filters work correctly
   - Test pagination
   - Test error states

2. **Edge Cases:**
   - Empty data sets
   - Network errors
   - Permission errors
   - Form validation errors

3. **Integration Testing:**
   - Verify components work with existing hooks
   - Test with different user permissions
   - Test with different locales

---

## Summary

**Overall Assessment:** ✅ **Good** - All critical and medium priority issues have been fixed

The refactoring successfully extracts components and follows established patterns. All identified issues have been resolved:
- ✅ Fixed critical bug (duplicate column keys)
- ✅ Fixed consistency issues (styling, structure)
- ✅ Fixed code quality issues (unused code, missing dependencies)

**Status:** ✅ **Ready for merge** - All critical and medium priority issues have been addressed.

---

## Files Changed

### New Components Created
- `src/components/accounting/suppliers/SupplierAddModal.tsx`
- `src/components/accounting/suppliers/SupplierEditModal.tsx`
- `src/components/accounting/suppliers/DeleteSupplierDialog.tsx`
- `src/components/accounting/suppliers/SuppliersFiltersCard.tsx`
- `src/components/accounting/suppliers/SuppliersTableCard.tsx`
- `src/components/events/WeddingAddModal.tsx`
- `src/components/events/WeddingEditModal.tsx`
- `src/components/events/WeddingsFiltersCard.tsx`
- `src/components/events/WeddingsTableCard.tsx`

### Pages Updated
- `src/app/[locale]/dashboard/accounting/suppliers/page.tsx`
- `src/app/[locale]/dashboard/events/weddings/page.tsx`

