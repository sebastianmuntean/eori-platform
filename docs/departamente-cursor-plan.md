# Cursor Plan: Implementare Departamente

## Overview
Implementare completă a modulului Departamente pentru gestionarea departamentelor din cadrul parohiilor.

---

## Task 1: Schema de Bază de Date

### 1.1. Creează schema file
**File**: `database/schema/core/departments.ts`
**Status**: ⬜ Not Started

**Action**: Create new file with content:
```typescript
import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { parishes } from './parishes';

export const departments = pgTable('departments', {
  id: uuid('id').primaryKey().defaultRandom(),
  parishId: uuid('parish_id').notNull().references(() => parishes.id, { onDelete: 'cascade' }),
  code: varchar('code', { length: 20 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  headName: varchar('head_name', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

**Verification**: 
- [ ] File created
- [ ] Imports correct
- [ ] All fields defined
- [ ] Foreign key to parishes with cascade delete

---

### 1.2. Export schema în core index
**File**: `database/schema/core/index.ts`
**Status**: ⬜ Not Started

**Action**: Add export:
```typescript
export * from './departments';
```

**Verification**:
- [ ] Export added
- [ ] No TypeScript errors

---

### 1.3. Verifică export în schema principal
**File**: `database/schema/index.ts`
**Status**: ⬜ Not Started

**Action**: Verify that `export * from './core';` exists

**Verification**:
- [ ] Core export exists
- [ ] Departments accessible via `@/database/schema`

---

### 1.4. Generează migrația
**Command**: `npm run db:generate`
**Status**: ⬜ Not Started

**Action**: 
1. Run `npm run db:generate`
2. Check generated migration file in `database/migrations/`
3. Review SQL for correctness

**Verification**:
- [ ] Migration file generated
- [ ] SQL creates table correctly
- [ ] Foreign key constraint present
- [ ] Index on parish_id created

**Next Step**: User must manually run SQL migration

---

## Task 2: API Routes - List/Create

### 2.1. Creează route file pentru list/create
**File**: `src/app/api/departments/route.ts`
**Status**: ⬜ Not Started

**Dependencies**: Task 1.1, Task 1.2, Task 1.3

**Action**: Create file with GET and POST handlers

**Key Requirements**:
- GET: Support pagination, search, filtering by parishId, isActive, sorting
- POST: Validate with Zod, check parish exists, check duplicate code per parish
- Error handling with formatErrorResponse
- Logging for debugging

**Verification**:
- [ ] File created
- [ ] GET handler implemented
- [ ] POST handler implemented
- [ ] Zod validation schema defined
- [ ] Error handling present
- [ ] Logging present

**Test Cases**:
- [ ] GET returns paginated list
- [ ] GET filters by parishId
- [ ] GET filters by isActive
- [ ] GET searches in name, code, headName
- [ ] GET sorts correctly
- [ ] POST creates department successfully
- [ ] POST rejects invalid data
- [ ] POST rejects duplicate code for same parish
- [ ] POST rejects non-existent parish

---

## Task 3: API Routes - Get/Update/Delete

### 3.1. Creează route file pentru get/update/delete
**File**: `src/app/api/departments/[id]/route.ts`
**Status**: ⬜ Not Started

**Dependencies**: Task 2.1

**Action**: Create file with GET, PUT, DELETE handlers

**Key Requirements**:
- GET: Return department by ID, 404 if not found
- PUT: Update department, validate, check duplicates, 404 if not found
- DELETE: Delete department, 404 if not found
- All with proper error handling

**Verification**:
- [ ] File created
- [ ] GET handler implemented
- [ ] PUT handler implemented
- [ ] DELETE handler implemented
- [ ] 404 handling for all methods
- [ ] Validation for PUT

**Test Cases**:
- [ ] GET returns department by ID
- [ ] GET returns 404 for non-existent ID
- [ ] PUT updates department successfully
- [ ] PUT rejects duplicate code
- [ ] PUT returns 404 for non-existent ID
- [ ] DELETE removes department
- [ ] DELETE returns 404 for non-existent ID

---

## Task 4: React Hook

### 4.1. Creează useDepartments hook
**File**: `src/hooks/useDepartments.ts`
**Status**: ⬜ Not Started

**Dependencies**: Task 2.1, Task 3.1

**Action**: Create hook with:
- State: departments, loading, error, pagination
- Functions: fetchDepartments, createDepartment, updateDepartment, deleteDepartment
- TypeScript interfaces for Department and return type

**Verification**:
- [ ] File created
- [ ] Department interface defined
- [ ] UseDepartmentsReturn interface defined
- [ ] fetchDepartments implemented
- [ ] createDepartment implemented
- [ ] updateDepartment implemented
- [ ] deleteDepartment implemented
- [ ] Error handling present
- [ ] Loading states managed

**Test Cases**:
- [ ] Hook exports correctly
- [ ] fetchDepartments updates state correctly
- [ ] createDepartment calls API and refreshes list
- [ ] updateDepartment calls API and refreshes list
- [ ] deleteDepartment calls API and refreshes list
- [ ] Errors are caught and set in state

---

## Task 5: UI Page Implementation

### 5.1. Actualizează pagina departamente
**File**: `src/app/[locale]/dashboard/modules/administration/departamente/page.tsx`
**Status**: ⬜ Not Started (currently placeholder)

**Dependencies**: Task 4.1

**Action**: Replace placeholder with full implementation

**Components Needed**:
- Breadcrumbs
- Header with title and Add button
- Card with filters (search, parish filter, status filter)
- Table with columns: code, name, parish, headName, phone, status, actions
- Pagination controls
- Add Modal
- Edit Modal
- Delete confirmation

**State Management**:
- searchTerm, parishFilter, statusFilter, currentPage
- showAddModal, showEditModal
- selectedDepartment, formData

**Verification**:
- [ ] Page imports useDepartments hook
- [ ] Page imports useParishes hook
- [ ] Breadcrumbs configured correctly
- [ ] Search input functional
- [ ] Parish filter dropdown functional
- [ ] Status filter dropdown functional
- [ ] Table displays data correctly
- [ ] Add button opens modal
- [ ] Edit button opens modal with data
- [ ] Delete button shows confirmation
- [ ] Pagination works
- [ ] Forms validate required fields

**Test Cases**:
- [ ] Page loads without errors
- [ ] Departments list displays
- [ ] Search filters results
- [ ] Parish filter filters results
- [ ] Status filter filters results
- [ ] Add modal opens and closes
- [ ] Edit modal opens with correct data
- [ ] Create department works
- [ ] Update department works
- [ ] Delete department works
- [ ] Pagination navigates correctly

---

## Task 6: Translations

### 6.1. Adaugă traduceri română
**File**: `src/locales/ro/common.json`
**Status**: ⬜ Not Started

**Action**: Add translations:
```json
{
  "departamente": "Departamente",
  "headName": "Șef Departament",
  "allParishes": "Toate Parohiile",
  "selectParish": "Selectează Parohia",
  "fillRequiredFields": "Te rugăm să completezi toate câmpurile obligatorii",
  "confirmDelete": "Ești sigur că vrei să ștergi acest departament?",
  "code": "Cod",
  "description": "Descriere"
}
```

**Verification**:
- [ ] All keys added
- [ ] JSON valid
- [ ] No duplicate keys

---

### 6.2. Adaugă traduceri engleză
**File**: `src/locales/en/common.json`
**Status**: ⬜ Not Started

**Action**: Add translations:
```json
{
  "departamente": "Departments",
  "headName": "Head of Department",
  "allParishes": "All Parishes",
  "selectParish": "Select Parish",
  "fillRequiredFields": "Please fill in all required fields",
  "confirmDelete": "Are you sure you want to delete this department?",
  "code": "Code",
  "description": "Description"
}
```

**Verification**:
- [ ] All keys added
- [ ] JSON valid
- [ ] Keys match Romanian file

---

## Task 7: Testing & Verification

### 7.1. Test API Routes
**Status**: ⬜ Not Started

**Action**: Test all endpoints manually or with Postman/Thunder Client

**Test Checklist**:
- [ ] GET /api/departments - returns list
- [ ] GET /api/departments?parishId=xxx - filters correctly
- [ ] GET /api/departments?search=xxx - searches correctly
- [ ] GET /api/departments?isActive=true - filters by status
- [ ] GET /api/departments?page=2 - pagination works
- [ ] POST /api/departments - creates successfully
- [ ] POST /api/departments - rejects invalid data
- [ ] POST /api/departments - rejects duplicate code
- [ ] GET /api/departments/:id - returns department
- [ ] GET /api/departments/:id - returns 404 for invalid ID
- [ ] PUT /api/departments/:id - updates successfully
- [ ] PUT /api/departments/:id - rejects duplicate code
- [ ] DELETE /api/departments/:id - deletes successfully
- [ ] DELETE /api/departments/:id - returns 404 for invalid ID

---

### 7.2. Test UI Functionality
**Status**: ⬜ Not Started

**Action**: Test all UI interactions

**Test Checklist**:
- [ ] Page loads without errors
- [ ] Departments display in table
- [ ] Search input filters table
- [ ] Parish dropdown filters table
- [ ] Status dropdown filters table
- [ ] Add button opens modal
- [ ] Add modal form validates
- [ ] Add modal creates department
- [ ] Edit button opens modal with data
- [ ] Edit modal updates department
- [ ] Delete button shows confirmation
- [ ] Delete removes department
- [ ] Pagination buttons work
- [ ] Breadcrumbs navigate correctly
- [ ] Error messages display correctly
- [ ] Loading states show correctly

---

### 7.3. Test Edge Cases
**Status**: ⬜ Not Started

**Test Cases**:
- [ ] Empty list displays correctly
- [ ] No search results shows message
- [ ] Invalid form data shows errors
- [ ] Network errors handled gracefully
- [ ] Duplicate code shows error
- [ ] Non-existent parish shows error
- [ ] Large lists paginate correctly

---

## Task 8: Code Review & Cleanup

### 8.1. Linting
**Status**: ⬜ Not Started

**Action**: Run linter and fix issues
**Command**: Check for linting errors

**Verification**:
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] All imports used
- [ ] No console.logs in production code (except error logs)

---

### 8.2. Type Safety
**Status**: ⬜ Not Started

**Verification**:
- [ ] All types defined
- [ ] No `any` types used
- [ ] Interfaces exported where needed
- [ ] Zod schemas match TypeScript types

---

## Implementation Order

1. **Task 1**: Schema (1.1 → 1.2 → 1.3 → 1.4)
2. **Task 2**: API List/Create (2.1)
3. **Task 3**: API Get/Update/Delete (3.1)
4. **Task 4**: React Hook (4.1)
5. **Task 6**: Translations (6.1 → 6.2)
6. **Task 5**: UI Page (5.1)
7. **Task 7**: Testing (7.1 → 7.2 → 7.3)
8. **Task 8**: Cleanup (8.1 → 8.2)

---

## Notes

- **Migration**: After Task 1.4, user must manually run SQL migration
- **Testing**: Use Postman/Thunder Client for API testing before UI implementation
- **Error Handling**: All API routes must use formatErrorResponse
- **Logging**: Use console.log for debugging (remove before production)
- **Validation**: Use Zod for all input validation
- **Multi-tenant**: All queries should filter by parishId when user context available

---

## Success Criteria

✅ All tasks completed
✅ All tests passing
✅ No linting errors
✅ Page accessible in menu
✅ CRUD operations work end-to-end
✅ Error handling works correctly
✅ Translations display correctly




