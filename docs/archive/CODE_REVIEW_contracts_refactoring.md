# Code Review: Contracts Page Refactoring

## Overview

This code review covers the refactoring of the Contracts page that extracted ~1084 lines of JSX and business logic into separate components and hooks.

**Files Reviewed:**
- `src/components/accounting/contracts/ContractsPageContent.tsx`
- `src/hooks/useContractInvoiceGeneration.ts`
- `src/components/accounting/contracts/ContractReportPrint.tsx`
- `src/app/[locale]/dashboard/accounting/contracts/page.tsx`

**Date:** 2024-12-19

---

## ✅ Functionality

### Intended Behavior
- ✅ Page correctly displays contracts with filtering and pagination
- ✅ CRUD operations (Create, Read, Update, Delete) work as expected
- ✅ Invoice generation and viewing functionality preserved
- ✅ Report printing functionality maintained
- ✅ Permission checks properly implemented

### Edge Cases
- ✅ Empty state handling present
- ✅ Loading states handled
- ⚠️ Error handling uses `alert()` instead of toast notifications
- ⚠️ Missing validation for form inputs beyond required fields

---

## 🔴 Critical Issues

### 1. Security: XSS Vulnerability in ContractReportPrint

**Location:** `src/components/accounting/contracts/ContractReportPrint.tsx:65-327`

**Issue:** Template literals with user data are directly inserted into HTML without sanitization.

```typescript
const reportHtml = `
  <title>Fișa Contract ${contract.contractNumber}</title>
  <span class="header-info-value">${contract.title || '-'}</span>
  <span class="header-info-value">${getClientName(contract.clientId)}</span>
`;
```

**Risk:** If `contractNumber`, `title`, or client data contains malicious scripts, they will be executed.

**Fix:** Use `sanitizeHtml()` utility function from `@/lib/utils/accounting`.

---

### 2. User Experience: Using `alert()` Instead of Toast Notifications

**Location:** Multiple locations in `ContractsPageContent.tsx`

**Issue:** Blocking `alert()` calls provide poor UX and are inconsistent with the rest of the application.

```typescript
// Line 145, 169, 275, 280
alert(t('fillRequiredFields'));
alert(t('contractRenewed') || 'Invoice generated successfully');
alert(error || t('error') || 'Failed to generate invoice');
```

**Fix:** Replace with `useToast()` hook following the pattern from other refactored pages.

---

## 🟡 Medium Priority Issues

### 3. Code Duplication: Utility Functions

**Location:** `ContractsPageContent.tsx` and `ContractReportPrint.tsx`

**Issue:** `formatCurrency`, `formatDate`, and `getClientName` are duplicated.

**Fix:** Use existing utilities from `@/lib/utils/accounting.ts`:
- `formatCurrency()` - already exists
- `formatDate()` - already exists  
- `getClientDisplayName()` - exists but needs to be adapted for clientId lookup

---

### 4. Type Safety: Using `any` Types

**Location:** Multiple locations

**Issues:**
- Line 109: `const params: any = { ... }`
- Line 173: `const updateData: any = { ... }`
- Line 238: `invoiceItemTemplate: (contract as any).invoiceItemTemplate`

**Fix:** Create proper TypeScript interfaces for these types.

---

### 5. Code Organization: Table Columns Should Be Extracted

**Location:** `ContractsPageContent.tsx:686-787`

**Issue:** Invoice table columns are defined inline (100+ lines) and should be extracted to a separate file following the pattern from other pages.

**Fix:** Create `src/components/accounting/contracts/ContractInvoiceTableColumns.tsx`

---

### 6. Constants: Magic Numbers

**Location:** `ContractsPageContent.tsx:111`

**Issue:** Hardcoded `pageSize: 10` should be a constant.

**Fix:** Extract to `const PAGE_SIZE = 10;` at the top of the file.

---

### 7. Form Data Management: Duplicated Initial State

**Location:** `ContractsPageContent.tsx:74-96` and `285-309`

**Issue:** Initial form state is duplicated in `useState` and `resetForm`.

**Fix:** Create `createEmptyContractFormData()` utility function following the pattern from `clients.ts`.

---

### 8. Validation: Duplicated Logic

**Location:** `ContractsPageContent.tsx:144-147` and `168-171`

**Issue:** Form validation is duplicated between `handleCreate` and `handleUpdate`.

**Fix:** Extract to a `validateContractForm()` function.

---

### 9. Performance: Inline Filter Handlers

**Location:** `ContractsPageContent.tsx:475-517`

**Issue:** Multiple inline arrow functions in filter props cause unnecessary re-renders.

**Fix:** Memoize filter handlers using `useCallback`.

---

### 10. Error Handling: Missing Error States

**Location:** `ContractsPageContent.tsx:143-159`

**Issue:** No error handling if `createContract` fails (returns `null`).

**Fix:** Add proper error handling with toast notifications.

---

## 🟢 Low Priority / Suggestions

### 11. Hook Design: useContractInvoiceGeneration

**Location:** `src/hooks/useContractInvoiceGeneration.ts:46`

**Issue:** Hook automatically refreshes invoices after generation, which might not always be desired.

**Suggestion:** Make refresh optional or let the caller handle it.

---

### 12. Component Size: ContractReportPrint

**Location:** `src/components/accounting/contracts/ContractReportPrint.tsx`

**Issue:** Component is 355 lines - could be split into smaller components.

**Suggestion:** Extract report HTML generation to a separate utility function.

---

### 13. Missing Loading States

**Location:** `ContractsPageContent.tsx:252-260`

**Issue:** `handleViewInvoices` doesn't show loading state while fetching invoices.

**Suggestion:** Add loading state for better UX.

---

## 📋 Refactoring Checklist

- [ ] Fix XSS vulnerability in ContractReportPrint
- [ ] Replace all `alert()` calls with toast notifications
- [ ] Extract utility functions to shared location
- [ ] Remove `any` types and add proper interfaces
- [ ] Extract table columns to separate file
- [ ] Extract constants (PAGE_SIZE)
- [ ] Create form data utility functions
- [ ] Extract validation logic
- [ ] Memoize filter handlers
- [ ] Improve error handling throughout
- [ ] Add loading states where missing

---

## Summary

The refactoring successfully separates concerns and follows the established pattern. However, there are several critical security and UX issues that need to be addressed, along with code quality improvements for maintainability and type safety.

**Priority Actions:**
1. 🔴 Fix XSS vulnerability (Critical)
2. 🔴 Replace alerts with toasts (Critical)
3. 🟡 Extract utilities and improve type safety (Medium)
4. 🟡 Extract table columns (Medium)
5. 🟢 Performance optimizations (Low)
