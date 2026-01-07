# HR Module Refactoring Improvements

## Overview

This document outlines the improvements made to eliminate code duplication and improve maintainability in the HR module page content components.

---

## Problem Identified

All five HR page content components contained nearly identical code:
- **~400+ lines of duplicated code** across 5 components
- Same state management patterns
- Same handler implementations
- Same form submission logic
- Same delete confirmation patterns

---

## Solution: `useHRCrudOperations` Hook

Created a reusable hook that extracts all common CRUD operations into a single, maintainable location.

### Benefits

1. **Eliminates Code Duplication**: Reduces ~400 lines of duplicated code to a single hook
2. **Consistent Behavior**: Ensures all HR pages behave the same way
3. **Easier Maintenance**: Changes to CRUD logic only need to be made in one place
4. **Type Safety**: Fully typed with TypeScript generics
5. **Flexible**: Supports custom messages, callbacks, and delete message generators

---

## Hook API

### Configuration

```typescript
interface HRCrudOperationsConfig<T extends { id: string }> {
  createEntity: (data: Partial<T>) => Promise<T | null>;
  updateEntity: (id: string, data: Partial<T>) => Promise<T | null>;
  deleteEntity: (id: string) => Promise<boolean>;
  
  entityName: string;
  entityNamePlural: string;
  
  messages?: {
    created?: string;
    updated?: string;
    deleted?: string;
    errorCreating?: string;
    errorUpdating?: string;
    errorDeleting?: string;
    confirmDelete?: string;
  };
  
  onEntityCreated?: (entity: T) => void;
  onEntityUpdated?: (entity: T) => void;
  onEntityDeleted?: (id: string) => void;
  onRefresh?: () => Promise<void> | void;
  
  getDeleteMessage?: (entity: T) => string;
}
```

### Return Value

```typescript
interface HRCrudOperationsReturn<T extends { id: string }> {
  // State
  isFormOpen: boolean;
  selectedEntity: T | null;
  isDeleteDialogOpen: boolean;
  entityToDelete: T | null;
  isSubmitting: boolean;
  
  // Handlers
  handleAdd: () => void;
  handleEdit: (entity: T) => void;
  handleDelete: (entity: T) => void;
  handleFormClose: () => void;
  handleDeleteDialogClose: () => void;
  handleFormSubmit: (data: Partial<T>) => Promise<void>;
  handleConfirmDelete: () => Promise<void>;
  
  // Delete message
  deleteMessage: string;
}
```

---

## Usage Example

### Before (150+ lines)

```typescript
export function EmployeesPageContent({ locale }: EmployeesPageContentProps) {
  const t = useTranslations('common');
  const { showToast } = useToast();
  
  const { createEmployee, updateEmployee, deleteEmployee } = useEmployees();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ... 100+ lines of handlers and logic ...
}
```

### After (30 lines)

```typescript
export function EmployeesPageContent({ locale }: EmployeesPageContentProps) {
  const t = useTranslations('common');
  
  const { createEmployee, updateEmployee, deleteEmployee } = useEmployees();
  
  const {
    isFormOpen,
    selectedEntity: selectedEmployee,
    isDeleteDialogOpen,
    entityToDelete: employeeToDelete,
    isSubmitting,
    handleAdd,
    handleEdit,
    handleDelete,
    handleFormClose,
    handleDeleteDialogClose,
    handleFormSubmit,
    handleConfirmDelete,
    deleteMessage,
  } = useHRCrudOperations<Employee>({
    createEntity: createEmployee,
    updateEntity: updateEmployee,
    deleteEntity: deleteEmployee,
    entityName: 'Employee',
    entityNamePlural: 'Employees',
    getDeleteMessage: (employee) =>
      `${t('confirmDeleteEmployee') || 'Are you sure you want to delete'} ${employee.firstName} ${employee.lastName}?`,
  });
  
  // ... JSX remains the same ...
}
```

---

## Code Reduction

| Component | Before | After | Reduction |
|-----------|--------|-------|-----------|
| EmployeesPageContent | ~150 lines | ~80 lines | 47% |
| ContractsPageContent | ~165 lines | ~95 lines | 42% |
| PositionsPageContent | ~150 lines | ~80 lines | 47% |
| SalariesPageContent | ~195 lines | ~125 lines | 36% |
| TimeTrackingPageContent | ~165 lines | ~95 lines | 42% |
| **Total** | **~825 lines** | **~475 lines** | **42% reduction** |

---

## Features

### 1. Automatic Toast Notifications

The hook automatically shows success/error toasts for all operations:
- Create: "Employee created successfully"
- Update: "Employee updated successfully"
- Delete: "Employee deleted successfully"
- Errors: Appropriate error messages

### 2. Custom Messages

Supports custom messages via the `messages` config:

```typescript
useHRCrudOperations({
  // ...
  messages: {
    created: 'Custom creation message',
    updated: 'Custom update message',
    deleted: 'Custom deletion message',
  },
});
```

### 3. Custom Delete Messages

Supports custom delete message generation:

```typescript
useHRCrudOperations({
  // ...
  getDeleteMessage: (employee) =>
    `Delete ${employee.firstName} ${employee.lastName}?`,
});
```

### 4. Refresh Callbacks

Supports automatic data refresh after operations:

```typescript
useHRCrudOperations({
  // ...
  onRefresh: async () => {
    await fetchEmployees({ page: 1, pageSize: 10 });
  },
});
```

### 5. Entity Lifecycle Callbacks

Supports callbacks for entity lifecycle events:

```typescript
useHRCrudOperations({
  // ...
  onEntityCreated: (employee) => {
    // Log analytics, update cache, etc.
  },
  onEntityUpdated: (employee) => {
    // Handle update side effects
  },
  onEntityDeleted: (id) => {
    // Clean up related data
  },
});
```

---

## Migration Guide

### Step 1: Import the Hook

```typescript
import { useHRCrudOperations } from '@/hooks/useHRCrudOperations';
```

### Step 2: Replace State Management

**Remove:**
```typescript
const [isFormOpen, setIsFormOpen] = useState(false);
const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
const [entityToDelete, setEntityToDelete] = useState<Entity | null>(null);
const [isSubmitting, setIsSubmitting] = useState(false);
```

**Replace with:**
```typescript
const {
  isFormOpen,
  selectedEntity,
  isDeleteDialogOpen,
  entityToDelete,
  isSubmitting,
  // ... handlers
} = useHRCrudOperations({ /* config */ });
```

### Step 3: Remove Handlers

Remove all handler implementations - they're provided by the hook:
- `handleAdd`
- `handleEdit`
- `handleDelete`
- `handleFormClose`
- `handleDeleteDialogClose`
- `handleFormSubmit`
- `handleConfirmDelete`

### Step 4: Remove Delete Message Logic

Remove `deleteMessage` useMemo - it's provided by the hook.

### Step 5: Update JSX

The JSX remains the same, just use the handlers from the hook.

---

## Testing

The hook should be tested with:
1. Unit tests for each CRUD operation
2. Error handling scenarios
3. Loading state management
4. Toast notification verification
5. Callback execution

---

## Future Enhancements

1. **Bulk Operations**: Support for bulk delete/update
2. **Optimistic Updates**: Support for optimistic UI updates
3. **Undo Functionality**: Support for undo after delete
4. **Validation Integration**: Built-in form validation support
5. **Cache Management**: Automatic cache invalidation

---

## Conclusion

The `useHRCrudOperations` hook significantly improves code quality by:
- Eliminating code duplication
- Ensuring consistent behavior
- Making maintenance easier
- Providing a flexible, type-safe API

All HR page content components should be migrated to use this hook.

