# React Hooks Order Violations - Search Report

## Overview

This report documents the search for files that violate React's Rules of Hooks by calling hooks after a conditional return when using `useRequirePermission`.

## Search Criteria

Files were checked for the following pattern:
1. Uses `useRequirePermission` hook
2. Has an early return based on loading state: `if (loading)` or `if (permissionLoading)`
3. Has hooks (`useState`, `useEffect`, `useCallback`, `useMemo`) defined **after** the early return

## Files with Violations Found

### 1. `src/app/[locale]/dashboard/registry/general-register/[id]/page.tsx` ❌

**Violation Details:**
- Line 28: `useRequirePermission` is called
- Lines 31-33: Early return `if (permissionLoading) { return null; }`
- Lines 35-39: **Hooks called AFTER early return:**
  - `useState` (lines 35-38) - 4 instances
  - `useToast` (line 39) - custom hook
- Line 41: `useCallback` (line 41)
- Line 54: `useEffect` (line 54)
- Line 58: `useCallback` (line 58)
- Line 67: `useCallback` (line 67)

**Status:** Needs fixing

## Files Checked - No Violations ✅

The following files were checked and found to be correctly structured (all hooks are called before any conditional returns):

1. `src/app/[locale]/dashboard/analytics/page.tsx`
   - All hooks (useState, useEffect) are before the early return at line 105

2. `src/app/[locale]/dashboard/data-statistics/page.tsx`
   - All hooks are before the early return at line 844

3. `src/app/[locale]/dashboard/accounting/clients/[id]/statement/page.tsx`
   - All hooks (useState, useEffect, useMemo, useCallback) are before the early return at line 160

4. `src/app/[locale]/dashboard/registry/registratura/registrul-general/page.tsx`
   - No hooks after early return (only regular functions)

5. `src/app/[locale]/dashboard/registry/registratura/configurari-registre/page.tsx`
   - No hooks after early return

6. `src/app/[locale]/dashboard/registry/register-configurations/page.tsx`
   - No hooks after early return

7. `src/app/[locale]/dashboard/registry/general-register/page.tsx`
   - No hooks after early return

8. `src/app/[locale]/dashboard/hr/reports/page.tsx`
   - No hooks after early return

9. `src/app/[locale]/dashboard/hr/page.tsx`
   - No hooks after early return

10. `src/app/[locale]/dashboard/page.tsx`
    - No hooks after early return

## Files Already Fixed (Excluded from Search)

The following files were already fixed according to `HOOKS_ORDER_FIX_REPORT.md` and `HOOKS_ORDER_FIX_REPORT_COMPLETE.md`:

- Most HR module files (employees, contracts, positions, salaries, time-tracking)
- Most catechesis module files
- Most registry/online-forms files
- Most pilgrimages files
- Most accounting files
- Various other pages

## Summary

**Total files with violations found:** 1

**Files needing fixes:**
1. `src/app/[locale]/dashboard/registry/general-register/[id]/page.tsx`

## Next Steps

1. Fix the violation in `registry/general-register/[id]/page.tsx` by:
   - Moving all hooks (useState, useToast, useCallback, useEffect) before the early return
   - Adding guards in useEffect hooks: `if (permissionLoading) return;`
   - Adding `permissionLoading` to dependency arrays
   - Moving the early return to after all hooks

2. Continue checking remaining files that use `useRequirePermission` for similar patterns

## Notes

- The search focused on page components in `src/app/[locale]/dashboard/**/page.tsx`
- Some files may have been missed if they use different variable names for loading state
- Files with no hooks after early returns are correctly structured and don't need changes

