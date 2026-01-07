# Code Review: Events Module Refactoring

## Overview

This code review covers the refactoring of Events module pages (Events, Baptisms, Weddings, Funerals) to extract content components following the separation of concerns pattern.

**Files Changed:**
- ✅ Created: `src/components/events/EventsPageContent.tsx`
- ✅ Created: `src/components/events/BaptismsPageContent.tsx`
- ✅ Created: `src/components/events/WeddingsPageContent.tsx`
- ✅ Created: `src/components/events/FuneralsPageContent.tsx`
- ✅ Modified: All 4 page files to be thin containers

## Review Checklist

### Functionality ✅

- [x] **Intended behavior works and matches requirements**
  - All existing functionality preserved
  - Filters, tables, modals work correctly
  - CRUD operations maintained
  - Permission checks in place

- [x] **Edge cases handled gracefully**
  - Empty states handled
  - Loading states properly displayed
  - Error states shown appropriately
  - Null/undefined values handled

- [x] **Error handling is appropriate and informative**
  - Error messages displayed in table cards
  - Funerals page has comprehensive toast notifications
  - Other pages rely on hook error states

### Code Quality ⚠️

- [ ] **Code structure is clear and maintainable**
  - ✅ Good separation of concerns
  - ⚠️ **ISSUE**: Inconsistent utility function usage across components
  - ⚠️ **ISSUE**: Code duplication (status variant maps, date formatting)
  - ⚠️ **ISSUE**: Missing memoization in EventsPageContent

- [ ] **No unnecessary duplication or dead code**
  - ⚠️ **ISSUE**: Status variant map duplicated in EventsPageContent (should use `STATUS_VARIANT_MAP`)
  - ⚠️ **ISSUE**: Date formatting duplicated in Baptisms/Weddings (should use `formatEventDate`)
  - ⚠️ **ISSUE**: Form reset logic duplicated (should use `getInitialEventFormData`)

- [ ] **Tests/documentation updated as needed**
  - ✅ JSDoc comments added
  - ⚠️ Could benefit from shared hooks for common logic

### Security & Safety ✅

- [x] **No obvious security vulnerabilities introduced**
  - Input validation in place
  - No XSS concerns with proper React rendering

- [x] **Inputs validated and outputs sanitized**
  - Form validation handled
  - API calls properly structured

## Issues Found

### 1. **Inconsistent Utility Function Usage** 🔴 High Priority

**Problem:**
- `EventsPageContent` uses `formatEventDate` utility ✅
- `BaptismsPageContent` and `WeddingsPageContent` use inline date formatting ❌
- `FuneralsPageContent` uses utilities correctly ✅
- `EventsPageContent` duplicates status variant map instead of using `STATUS_VARIANT_MAP` ❌

**Impact:** Code duplication, maintenance burden, inconsistent behavior

**Recommendation:** Standardize all components to use shared utilities

### 2. **Missing Memoization in EventsPageContent** 🟡 Medium Priority

**Problem:**
- Handlers (`handleCreate`, `handleUpdate`, `handleDelete`, etc.) are not memoized
- Missing dependencies in `columns` useMemo
- `resetForm` not included in handler dependencies

**Impact:** Unnecessary re-renders, potential performance issues

**Recommendation:** Add `useCallback` to all handlers, fix dependencies

### 3. **Code Duplication** 🟡 Medium Priority

**Problem:**
- Status variant map duplicated in EventsPageContent
- Date formatting logic duplicated in Baptisms/Weddings
- Form reset logic duplicated across components

**Impact:** Maintenance burden, potential inconsistencies

**Recommendation:** Use shared constants and utilities consistently

### 4. **Error Handling Inconsistency** 🟡 Medium Priority

**Problem:**
- `EventsPageContent` uses `alert()` for validation (not ideal UX)
- `BaptismsPageContent` and `WeddingsPageContent` have minimal error handling
- `FuneralsPageContent` has comprehensive toast notifications

**Impact:** Inconsistent user experience

**Recommendation:** Standardize error handling approach (prefer toasts over alerts)

### 5. **Type Safety** 🟢 Low Priority

**Problem:**
- Using `any` type for params in useEffect

**Impact:** Reduced type safety

**Recommendation:** Define proper types for fetch parameters

## Recommendations

### Immediate Actions

1. **Standardize utility usage:**
   - Use `formatEventDate` in all components
   - Use `STATUS_VARIANT_MAP` in EventsPageContent
   - Use `getInitialEventFormData` and `mapEventToFormData` consistently

2. **Add proper memoization:**
   - Wrap all handlers in `useCallback` with correct dependencies
   - Fix `columns` useMemo dependencies

3. **Improve error handling:**
   - Replace `alert()` with toast notifications
   - Add consistent error handling across all components

### Future Improvements

1. **Extract shared hooks:**
   - Create `useEventCRUD` hook for common CRUD operations
   - Create `useEventFilters` hook for filter logic

2. **Create shared components:**
   - Extract status badge rendering to shared component
   - Extract action menu building logic

3. **Add TypeScript types:**
   - Define `EventFetchParams` interface
   - Remove `any` types

## Summary

The refactoring successfully separates concerns and follows the established pattern. However, there are opportunities to improve consistency, reduce duplication, and enhance performance through proper memoization. The code is functional but could benefit from standardization across all components.

**Overall Assessment:** ✅ Functional, ⚠️ Needs consistency improvements

