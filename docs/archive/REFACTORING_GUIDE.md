# Code Refactoring Guide: Extracting HTML/JSX from Pages

## Overview

This guide documents the refactoring pattern for extracting all HTML/JSX code from page files into separate components and hooks, improving code organization, maintainability, and testability.

## Refactoring Pattern

### Before (Page with Mixed Concerns)

```tsx
// page.tsx - Contains routing, permissions, business logic, AND JSX
export default function EntityPage() {
  // Routing
  const params = useParams();
  const locale = params.locale as string;
  
  // Permissions
  const { loading: permissionLoading } = useRequirePermission(PERMISSION);
  
  // Business logic (state, handlers, etc.)
  const [data, setData] = useState();
  const handleCreate = () => { /* ... */ };
  
  // JSX/HTML (should be extracted)
  return (
    <PageContainer>
      <PageHeader ... />
      <Table ... />
      <Modal ... />
    </PageContainer>
  );
}
```

### After (Separated Concerns)

```tsx
// page.tsx - Thin container: only routing, permissions, page title
export default function EntityPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('entityName'));

  const { loading: permissionLoading } = useRequirePermission(PERMISSION);

  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <EntityPageContent locale={locale} />;
}
```

```tsx
// components/EntityPageContent.tsx - All JSX and business logic
export function EntityPageContent({ locale }: Props) {
  // All business logic
  const [data, setData] = useState();
  const handleCreate = () => { /* ... */ };
  
  // All JSX/HTML
  return (
    <PageContainer>
      <PageHeader ... />
      <Table ... />
      <Modal ... />
    </PageContainer>
  );
}
```

## Benefits

1. **Separation of Concerns**: Pages handle routing/permissions, components handle presentation
2. **Reusability**: Components can be reused in different contexts
3. **Testability**: Business logic can be tested independently
4. **Maintainability**: Easier to find and modify code
5. **Code Organization**: Clear structure and file organization

## Step-by-Step Refactoring Process

### Step 1: Create Content Component

Create a new file: `src/components/[module]/[entity]/[Entity]PageContent.tsx`

```tsx
'use client';

import { /* all necessary imports */ } from '@/...';

interface EntityPageContentProps {
  locale: string;
  // Add other props as needed
}

export function EntityPageContent({ locale }: EntityPageContentProps) {
  // Move all business logic from page.tsx here
  // Move all JSX/HTML from page.tsx here
  
  return (
    // All JSX content
  );
}
```

### Step 2: Refactor Page File

Update `src/app/[locale]/dashboard/[module]/[entity]/page.tsx`:

```tsx
'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { PERMISSIONS } from '@/lib/permissions/...';
import { PageContainer } from '@/components/ui/PageContainer';
import { EntityPageContent } from '@/components/[module]/[entity]/EntityPageContent';

export default function EntityPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('entityName'));

  const { loading: permissionLoading } = useRequirePermission(PERMISSIONS.ENTITY_VIEW);

  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <EntityPageContent locale={locale} />;
}
```

### Step 3: Extract Business Logic to Hooks (Optional but Recommended)

For complex pages, create custom hooks:

```tsx
// hooks/useEntityCRUD.ts - Generic CRUD hook
export function useEntityCRUD<T, TFormData>(config: Config) {
  // All CRUD logic
  return { /* ... */ };
}

// hooks/useEntityFilters.ts - Filter logic
export function useEntityFilters() {
  // All filter logic
  return { /* ... */ };
}
```

## File Structure

```
src/
├── app/
│   └── [locale]/
│       └── dashboard/
│           └── [module]/
│               └── [entity]/
│                   └── page.tsx          # Thin container
├── components/
│   └── [module]/
│       └── [entity]/
│           ├── [Entity]PageContent.tsx   # All JSX
│           ├── [Entity]Table.tsx         # Table component
│           ├── [Entity]Filters.tsx       # Filters component
│           └── [Entity]Form.tsx          # Form component
└── hooks/
    ├── useEntityCRUD.ts                  # CRUD logic
    └── useEntityFilters.ts               # Filter logic
```

## Examples

### ✅ Refactored: Clients Page

- **Page**: `src/app/[locale]/dashboard/accounting/clients/page.tsx` (thin container)
- **Content**: `src/components/accounting/clients/ClientsPageContent.tsx` (all JSX)
- **Hook**: `src/hooks/useEntityCRUD.ts` (generic CRUD logic)

### 🔄 To Refactor: Other Pages

Apply the same pattern to:
- Products page
- Invoices page
- Payments page
- Contracts page
- Donations page
- Stock movements page
- Fixed assets pages
- And all other CRUD pages

## Checklist for Refactoring

- [ ] Create `[Entity]PageContent.tsx` component
- [ ] Move all JSX/HTML from page to content component
- [ ] Move all business logic from page to content component or hooks
- [ ] Update page file to be thin container
- [ ] Ensure permission checks remain in page file
- [ ] Ensure page title hook remains in page file
- [ ] Test that functionality remains unchanged
- [ ] Check for lint errors
- [ ] Update imports

## Common Patterns to Extract

### Table Columns
Extract to: `components/[module]/[entity]/[Entity]TableColumns.tsx`

```tsx
export function useEntityTableColumns(t: Function) {
  return useMemo(() => [
    { key: 'name', label: t('name'), sortable: true },
    // ...
  ], [t]);
}
```

### Filters
Extract to: `components/[module]/[entity]/[Entity]Filters.tsx`

```tsx
export function EntityFilters({ filters, onFilterChange }: Props) {
  return (
    <FilterGrid>
      {/* Filter components */}
    </FilterGrid>
  );
}
```

### Forms
Already extracted to: `components/[module]/[Entity]Form.tsx`

## Notes

- Keep page files focused on routing and permissions
- Move all presentation logic to components
- Extract reusable business logic to hooks
- Maintain consistent file structure
- Follow existing component patterns


