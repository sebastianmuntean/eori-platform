# 📋 Plan de Implementare Entități EORI

**Data:** 31 Decembrie 2025  
**Status:** Draft  
**Bazat pe:** Schema Drizzle existentă în `drizzle/schema/`

---

## 🏗️ Arhitectură per Modul

Pentru fiecare modul, vom implementa:

```
src/
├── app/
│   ├── api/
│   │   └── [module]/              # API Routes (CRUD + custom endpoints)
│   │       ├── route.ts           # GET (list), POST (create)
│   │       └── [id]/
│   │           └── route.ts       # GET (single), PUT, DELETE
│   └── [locale]/
│       └── dashboard/
│           └── modules/
│               └── [module]/
│                   └── page.tsx   # UI Page
├── components/
│   └── [module]/
│       ├── [Module]Form.tsx       # Create/Edit form
│       ├── [Module]Table.tsx      # Data table (optional)
│       └── [Module]Card.tsx       # Detail card (optional)
├── hooks/
│   └── use[Module].ts             # React hook for state & API
└── lib/
    └── validations/
        └── [module].ts            # Zod schemas
```

---

## 📊 Ordine de Implementare (Prioritate)

### SPRINT 1: Fundație (2-3 zile)
| # | Modul | Entități | Prioritate | Dependențe |
|---|-------|----------|------------|------------|
| 1 | **Core: Dioceses** | `dioceses` | 🔴 Critical | - |
| 2 | **Core: Deaneries** | `deaneries` | 🔴 Critical | dioceses |
| 3 | **Core: Parishes** | `parishes` | 🔴 Critical | dioceses, deaneries |
| 4 | **Auth: User-Parishes** | `userParishes` | 🔴 Critical | users, parishes |

### SPRINT 2: Partners + Documents (2-3 zile)
| # | Modul | Entități | Prioritate | Dependențe |
|---|-------|----------|------------|------------|
| 5 | **Partners** | `partners` | 🔴 Critical | parishes |
| 6 | **Documents** | `documents`, `attachments` | 🟠 High | parishes, partners |

### SPRINT 3: Cemetery (2-3 zile)
| # | Modul | Entități | Prioritate | Dependențe |
|---|-------|----------|------------|------------|
| 7 | **Cemeteries** | `cemeteries` | 🟠 High | parishes |
| 8 | **Cemetery Structure** | `parcels`, `rows`, `graves` | 🟠 High | cemeteries |
| 9 | **Concessions** | `concessions`, `concessionPayments`, `burials` | 🟠 High | graves, partners |

### SPRINT 4: Accounting (2-3 zile)
| # | Modul | Entități | Prioritate | Dependențe |
|---|-------|----------|------------|------------|
| 10 | **Accounts** | `accounts` | 🟠 High | parishes |
| 11 | **Transactions** | `transactions` | 🟠 High | accounts, partners |
| 12 | **Invoices** | `invoices`, `invoiceItems`, `invoicePayments` | 🟠 High | partners, accounts |
| 13 | **Receipt Series** | `receiptSeries` | 🟡 Medium | parishes |

### SPRINT 5: Inventory (2-3 zile)
| # | Modul | Entități | Prioritate | Dependențe |
|---|-------|----------|------------|------------|
| 14 | **Warehouses** | `warehouses` | 🟡 Medium | parishes |
| 15 | **Products** | `products` | 🟡 Medium | parishes, accounts |
| 16 | **Stock** | `stockLots`, `stockMovements` | 🟡 Medium | warehouses, products |
| 17 | **Sales** | `sales`, `saleItems` | 🟡 Medium | warehouses, products |

### SPRINT 6: Secondary Modules (3-4 zile)
| # | Modul | Entități | Prioritate | Dependențe |
|---|-------|----------|------------|------------|
| 18 | **Library** | `authors`, `publishers`, `domains`, `books`, `loans` | 🟢 Low | parishes, partners |
| 19 | **Fleet** | `vehicles`, `insurances`, `inspections`, `repairs` | 🟢 Low | parishes |
| 20 | **Assets** | `fixedAssets` | 🟢 Low | parishes |
| 21 | **HR** | `employees`, `leaves`, `timesheets` | 🟢 Low | parishes, partners |

### SPRINT 7: Cross-Cutting (1-2 zile)
| # | Modul | Entități | Prioritate | Dependențe |
|---|-------|----------|------------|------------|
| 22 | **Settings** | `parishSettings` | 🟡 Medium | parishes, accounts |
| 23 | **Audit** | `activityLog` | 🟡 Medium | parishes, users |
| 24 | **Notifications** | `notifications` | 🟡 Medium | parishes, users |

---

## 📝 Template Implementare per Modul

### 1. API Route - `src/app/api/[module]/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { [table] } from '@/drizzle/schema';
import { eq, and, desc, like, or } from 'drizzle-orm';
import { z } from 'zod';
import { formatErrorResponse } from '@/lib/errors';
import { getCurrentUser, requirePermission } from '@/lib/auth';

// Validation schemas
const createSchema = z.object({
  // fields...
});

const updateSchema = createSchema.partial();

// GET - List with pagination, filtering, sorting
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    await requirePermission(user, '[module].read');
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const parishId = user.currentParishId; // Multi-tenant filter
    
    // Query with parish filter
    const items = await db.select()
      .from([table])
      .where(and(
        eq([table].parishId, parishId),
        search ? like([table].name, `%${search}%`) : undefined
      ))
      .orderBy(desc([table].createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);
    
    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    return NextResponse.json(formatErrorResponse(error), { status: 500 });
  }
}

// POST - Create
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    await requirePermission(user, '[module].create');
    
    const body = await request.json();
    const validation = createSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ 
        success: false, 
        error: validation.error.errors[0].message 
      }, { status: 400 });
    }
    
    const [item] = await db.insert([table])
      .values({
        ...validation.data,
        parishId: user.currentParishId,
        createdBy: user.id,
        updatedBy: user.id,
      })
      .returning();
    
    // Log activity
    await logActivity({
      parishId: user.currentParishId,
      userId: user.id,
      action: 'create',
      entityType: '[module]',
      entityId: item.id,
    });
    
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    return NextResponse.json(formatErrorResponse(error), { status: 500 });
  }
}
```

### 2. React Hook - `src/hooks/use[Module].ts`

```typescript
'use client';

import { useState, useCallback } from 'react';

export interface [Entity] {
  id: string;
  // ... fields from schema
}

export function use[Module]() {
  const [items, setItems] = useState<[Entity][]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState(null);

  const fetchItems = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(params as any);
      const response = await fetch(`/api/[module]?${queryParams}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      setItems(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = useCallback(async (data) => {
    setLoading(true);
    try {
      const response = await fetch('/api/[module]', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      await fetchItems();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchItems]);

  // updateItem, deleteItem similar...

  return { items, loading, error, pagination, fetchItems, createItem };
}
```

### 3. Form Component - `src/components/[module]/[Module]Form.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface [Module]FormProps {
  initialData?: Partial<[Entity]>;
  onSubmit: (data: any) => Promise<boolean>;
  onCancel: () => void;
}

export function [Module]Form({ initialData, onSubmit, onCancel }: [Module]FormProps) {
  const [formData, setFormData] = useState({
    // ... initial values
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await onSubmit(formData);
    setLoading(false);
    if (success) onCancel();
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <div className="flex gap-2 mt-4">
        <Button type="submit" loading={loading}>
          {initialData ? 'Salvează' : 'Creează'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Anulează
        </Button>
      </div>
    </form>
  );
}
```

---

## 🔧 Implementare Detaliată per Modul

### MODUL 1: Dioceses (Episcopii)

**Fișiere de creat:**
```
src/app/api/dioceses/route.ts
src/app/api/dioceses/[id]/route.ts
src/app/[locale]/dashboard/superadmin/dioceses/page.tsx
src/components/dioceses/DioceseForm.tsx
src/hooks/useDioceses.ts
src/lib/validations/dioceses.ts
```

**API Endpoints:**
- `GET /api/dioceses` - List all dioceses
- `POST /api/dioceses` - Create diocese
- `GET /api/dioceses/[id]` - Get single diocese
- `PUT /api/dioceses/[id]` - Update diocese
- `DELETE /api/dioceses/[id]` - Delete diocese (soft)

**Validare Zod:**
```typescript
// src/lib/validations/dioceses.ts
import { z } from 'zod';

export const createDioceseSchema = z.object({
  code: z.string().min(1, 'Codul este obligatoriu').max(20),
  name: z.string().min(1, 'Denumirea este obligatorie').max(255),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  county: z.string().max(100).optional(),
  country: z.string().max(100).default('România'),
  phone: z.string().max(50).optional(),
  email: z.string().email('Email invalid').optional(),
  website: z.string().url('URL invalid').optional(),
  bishopName: z.string().max(255).optional(),
  isActive: z.boolean().default(true),
});

export const updateDioceseSchema = createDioceseSchema.partial();
```

---

### MODUL 2: Deaneries (Protopopiate)

**Fișiere de creat:**
```
src/app/api/deaneries/route.ts
src/app/api/deaneries/[id]/route.ts
src/app/[locale]/dashboard/superadmin/deaneries/page.tsx
src/components/deaneries/DeaneryForm.tsx
src/hooks/useDeaneries.ts
src/lib/validations/deaneries.ts
```

**Particularități:**
- Filtrare după `dioceseId`
- Dropdown pentru selectare dieceză în formular

---

### MODUL 3: Parishes (Parohii)

**Fișiere de creat:**
```
src/app/api/parishes/route.ts
src/app/api/parishes/[id]/route.ts
src/app/[locale]/dashboard/admin/parishes/page.tsx
src/components/parishes/ParishForm.tsx
src/components/parishes/ParishCard.tsx
src/hooks/useParishes.ts
src/lib/validations/parishes.ts
```

**Particularități:**
- Selectare dieceză și protopopiat (cascade dropdown)
- Hartă pentru coordonate GPS
- Număr enoriași

---

### MODUL 4: Partners (Parteneri)

**Fișiere de creat:**
```
src/app/api/partners/route.ts
src/app/api/partners/[id]/route.ts
src/app/[locale]/dashboard/modules/partners/page.tsx
src/components/partners/PartnerForm.tsx
src/components/partners/PartnerTypeSwitch.tsx
src/hooks/usePartners.ts
src/lib/validations/partners.ts
```

**Particularități:**
- Formular dinamic bazat pe `type` (person/company)
- Auto-generare cod: `PRT-000001`
- Validare CNP pentru persoane fizice
- Validare CUI pentru persoane juridice

**Funcție generare cod:**
```typescript
// src/lib/partners/code-generator.ts
export async function generatePartnerCode(parishId: string): Promise<string> {
  const [lastPartner] = await db
    .select({ code: partners.code })
    .from(partners)
    .where(eq(partners.parishId, parishId))
    .orderBy(desc(partners.code))
    .limit(1);
  
  if (!lastPartner) return 'PRT-000001';
  
  const lastNumber = parseInt(lastPartner.code.replace('PRT-', '')) || 0;
  return `PRT-${String(lastNumber + 1).padStart(6, '0')}`;
}
```

---

### MODUL 5: Documents (Registratură)

**Fișiere de creat:**
```
src/app/api/documents/route.ts
src/app/api/documents/[id]/route.ts
src/app/api/documents/[id]/attachments/route.ts
src/app/[locale]/dashboard/modules/documents/page.tsx
src/components/documents/DocumentForm.tsx
src/components/documents/DocumentTimeline.tsx
src/components/documents/AttachmentUpload.tsx
src/hooks/useDocuments.ts
src/lib/validations/documents.ts
src/lib/documents/numbering.ts (deja creat)
```

**Particularități:**
- Numerotare automată atomică (implementată)
- Direcție: IN/OUT
- Upload fișiere atașate
- Timeline pentru istoric document
- Răspuns la document (link la părinte)

---

### MODUL 6: Cemetery + Concessions

**Fișiere de creat:**
```
# Cemeteries
src/app/api/cemeteries/route.ts
src/app/api/cemeteries/[id]/route.ts
src/app/api/cemeteries/[id]/parcels/route.ts
src/app/api/cemeteries/[id]/structure/route.ts

# Concessions
src/app/api/concessions/route.ts
src/app/api/concessions/[id]/route.ts
src/app/api/concessions/[id]/payments/route.ts
src/app/api/concessions/expiring/route.ts

# Pages
src/app/[locale]/dashboard/modules/cemetery/page.tsx
src/app/[locale]/dashboard/modules/cemetery/[cemeteryId]/page.tsx
src/app/[locale]/dashboard/modules/concessions/page.tsx

# Components
src/components/cemetery/CemeteryForm.tsx
src/components/cemetery/CemeteryMap.tsx
src/components/cemetery/GraveCard.tsx
src/components/concessions/ConcessionForm.tsx
src/components/concessions/ConcessionPaymentForm.tsx
src/components/concessions/ExpiringConcessionsAlert.tsx

# Hooks
src/hooks/useCemeteries.ts
src/hooks/useConcessions.ts
```

**Particularități:**
- Structură ierarhică: Cimitir → Parcelă → Rând → Loc
- Hartă vizuală cimitir (grid)
- Alert concesiuni expirate
- Plăți parțiale

**Query concesiuni expirate:**
```typescript
// src/app/api/concessions/expiring/route.ts
export async function GET(request: Request) {
  const user = await getCurrentUser();
  const daysAhead = parseInt(searchParams.get('days') || '30');
  
  const expiring = await db.select()
    .from(concessions)
    .innerJoin(cemeteryGraves, eq(concessions.graveId, cemeteryGraves.id))
    .innerJoin(partners, eq(concessions.holderPartnerId, partners.id))
    .where(and(
      eq(concessions.parishId, user.currentParishId),
      eq(concessions.status, 'active'),
      sql`${concessions.expiryDate} <= CURRENT_DATE + INTERVAL '${daysAhead} days'`
    ))
    .orderBy(asc(concessions.expiryDate));
  
  return NextResponse.json({ success: true, data: expiring });
}
```

---

### MODUL 7: Accounting (Contabilitate)

**Fișiere de creat:**
```
# Accounts
src/app/api/accounts/route.ts
src/app/api/accounts/[id]/route.ts
src/app/api/accounts/tree/route.ts

# Transactions
src/app/api/transactions/route.ts
src/app/api/transactions/[id]/route.ts
src/app/api/transactions/summary/route.ts

# Invoices
src/app/api/invoices/route.ts
src/app/api/invoices/[id]/route.ts
src/app/api/invoices/[id]/items/route.ts
src/app/api/invoices/[id]/payments/route.ts

# Pages
src/app/[locale]/dashboard/modules/accounting/page.tsx
src/app/[locale]/dashboard/modules/invoices/page.tsx

# Components
src/components/accounting/AccountTree.tsx
src/components/accounting/TransactionForm.tsx
src/components/invoices/InvoiceForm.tsx
src/components/invoices/InvoiceItemsTable.tsx
src/components/invoices/InvoicePDF.tsx

# Hooks
src/hooks/useAccounts.ts
src/hooks/useTransactions.ts
src/hooks/useInvoices.ts
```

**Particularități:**
- Plan de conturi ierarhic (arbore)
- Balanță de verificare
- Facturi cu linii multiple
- Plăți parțiale pe facturi
- Generare PDF factură

---

### MODUL 8: Inventory (Gestiuni)

**Fișiere de creat:**
```
# Warehouses & Products
src/app/api/warehouses/route.ts
src/app/api/warehouses/[id]/route.ts
src/app/api/products/route.ts
src/app/api/products/[id]/route.ts

# Stock
src/app/api/stock/route.ts
src/app/api/stock/movements/route.ts
src/app/api/stock/transfer/route.ts

# Sales
src/app/api/sales/route.ts
src/app/api/sales/[id]/route.ts

# Pages
src/app/[locale]/dashboard/modules/inventory/page.tsx
src/app/[locale]/dashboard/modules/sales/page.tsx

# Components
src/components/inventory/WarehouseForm.tsx
src/components/inventory/ProductForm.tsx
src/components/inventory/StockMovementForm.tsx
src/components/inventory/TransferForm.tsx
src/components/sales/SaleForm.tsx
src/components/sales/SaleItemsTable.tsx

# Hooks
src/hooks/useWarehouses.ts
src/hooks/useProducts.ts
src/hooks/useStock.ts
src/hooks/useSales.ts
```

**Particularități:**
- Metode stoc: FIFO/LIFO/AVG
- Transfer între gestiuni
- Alertă stoc minim
- Vânzări pangar cu calcul automat

---

### MODUL 9-12: Module Secundare

**Library, Fleet, Assets, HR** - Implementare similară, mai simplă.

Fiecare modul urmează același pattern:
1. API Routes (CRUD)
2. React Hook
3. Form Component
4. List Page

---

## 🔐 Middleware Multi-Tenant

**Actualizare `src/lib/auth.ts`:**

```typescript
export async function getCurrentUser() {
  // Get user from session
  const session = await getSession();
  if (!session?.userId) throw new AuthError('Not authenticated');
  
  // Get user with parishes
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
    with: {
      userParishes: {
        with: { parish: true }
      },
      userRoles: {
        with: { role: true }
      }
    }
  });
  
  if (!user) throw new AuthError('User not found');
  
  // Get current parish (from session or primary)
  const currentParishId = session.currentParishId || 
    user.userParishes.find(up => up.isPrimary)?.parishId;
  
  return {
    ...user,
    currentParishId,
    parishes: user.userParishes.map(up => up.parish),
  };
}

export async function requirePermission(user: User, permission: string) {
  // Check role permissions + overrides
  const hasPermission = await checkUserPermission(user.id, permission);
  if (!hasPermission) {
    throw new ForbiddenError(`Missing permission: ${permission}`);
  }
}
```

---

## 📦 Componente UI Comune

**De adăugat în `src/components/ui/`:**

```
src/components/ui/
├── Select.tsx           # Dropdown select
├── DatePicker.tsx       # Date picker
├── FileUpload.tsx       # File upload
├── Tabs.tsx             # Tab navigation
├── Alert.tsx            # Alert/notification
├── Skeleton.tsx         # Loading skeleton
├── Pagination.tsx       # Pagination controls
├── SearchInput.tsx      # Search with debounce
├── ConfirmDialog.tsx    # Confirmation modal
└── DataTable.tsx        # Reusable data table
```

---

## 🌐 Traduceri (i18n)

**Adăugare fișiere în `src/locales/[lang]/`:**

```
src/locales/ro/
├── common.json          # (existent)
├── menu.json            # (existent)
├── auth.json            # (existent)
├── dioceses.json        # Nou
├── deaneries.json       # Nou
├── parishes.json        # Nou
├── partners.json        # Nou
├── documents.json       # Nou
├── cemetery.json        # Nou
├── accounting.json      # Nou
├── inventory.json       # Nou
├── library.json         # Nou
├── fleet.json           # Nou
├── assets.json          # Nou
├── hr.json              # Nou
└── notifications.json   # Nou
```

---

## ✅ Checklist Implementare

### Per Modul:
- [ ] Schema Drizzle (✅ deja făcut)
- [ ] Zod validation schema
- [ ] API Routes (GET, POST, PUT, DELETE)
- [ ] React Hook
- [ ] Form Component
- [ ] List Page
- [ ] Traduceri (ro, en, it)
- [ ] Permisiuni configurate
- [ ] Activity logging
- [ ] Teste (opțional)

### Global:
- [ ] Middleware multi-tenant
- [ ] Parish switcher în header
- [ ] Dashboard cu widgets per modul
- [ ] Notificări pentru expirări
- [ ] Export Excel/PDF
- [ ] Import din Excel

---

## 🚀 Comenzi Utile

```bash
# Generare migrări
npm run db:generate

# Aplicare migrări
npm run db:migrate

# Seed RBAC
npm run db:seed:rbac

# Development
npm run dev

# Build
npm run build

# Lint
npm run lint
```

---

## 📊 Estimare Timp

| Sprint | Module | Estimare |
|--------|--------|----------|
| Sprint 1 | Core (Dioceses, Deaneries, Parishes, UserParishes) | 2-3 zile |
| Sprint 2 | Partners + Documents | 2-3 zile |
| Sprint 3 | Cemetery + Concessions | 2-3 zile |
| Sprint 4 | Accounting | 2-3 zile |
| Sprint 5 | Inventory + Sales | 2-3 zile |
| Sprint 6 | Library, Fleet, Assets, HR | 3-4 zile |
| Sprint 7 | Settings, Audit, Notifications | 1-2 zile |
| **TOTAL** | | **~15-21 zile** |

---

**Notă:** Acest plan presupune un developer full-time. Timpul poate varia în funcție de complexitatea UI și cerințele de business.
