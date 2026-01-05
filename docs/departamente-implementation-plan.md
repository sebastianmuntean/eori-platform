# Plan Detaliat de Implementare - Departamente

## Overview

Modulul **Departamente** permite gestionarea departamentelor din cadrul parohiilor. Fiecare parohie poate avea mai multe departamente (ex: Catehism, Caritate, Tineret, etc.).

---

## 1. Schema de Bază de Date

### 1.1. Creează fișierul schema

**Fișier**: `database/schema/core/departments.ts`

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

### 1.2. Exportă schema în index

**Fișier**: `database/schema/core/index.ts`

Adaugă:
```typescript
export * from './departments';
```

**Fișier**: `database/schema/index.ts`

Verifică că include:
```typescript
export * from './core';
```

### 1.3. Generează migrația

**Pași**:
1. Rulează: `npm run db:generate`
2. Verifică fișierul generat în `database/migrations/`
3. Review SQL-ul generat
4. Rulează manual SQL-ul în baza de date

**SQL așteptat** (exemplu):
```sql
CREATE TABLE IF NOT EXISTS "departments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "parish_id" uuid NOT NULL REFERENCES "parishes"("id") ON DELETE CASCADE,
  "code" varchar(20) NOT NULL,
  "name" varchar(255) NOT NULL,
  "description" text,
  "head_name" varchar(255),
  "phone" varchar(50),
  "email" varchar(255),
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "departments_parish_id_idx" ON "departments"("parish_id");
```

---

## 2. API Routes

### 2.1. List/Create Route

**Fișier**: `src/app/api/departments/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { departments, parishes } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq, like, or, desc, asc, and } from 'drizzle-orm';
import { z } from 'zod';

const createDepartmentSchema = z.object({
  parishId: z.string().uuid('Invalid parish ID'),
  code: z.string().min(1, 'Code is required').max(20),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  headName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  isActive: z.boolean().optional().default(true),
});

export async function GET(request: Request) {
  console.log('Step 1: GET /api/departments - Fetching departments');

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const parishId = searchParams.get('parishId');
    const isActive = searchParams.get('isActive');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(departments.name, `%${search}%`),
          like(departments.code, `%${search}%`),
          like(departments.headName || '', `%${search}%`)
        )!
      );
    }

    if (parishId) {
      conditions.push(eq(departments.parishId, parishId));
    }

    if (isActive !== null && isActive !== undefined) {
      conditions.push(eq(departments.isActive, isActive === 'true'));
    }

    const whereClause = conditions.length > 0 
      ? (conditions.length === 1 ? conditions[0] : and(...conditions as any[]))
      : undefined;

    const totalCountResult = await db
      .select({ count: departments.id })
      .from(departments)
      .where(whereClause);
    const totalCount = totalCountResult.length;

    let query = db.select().from(departments);

    if (whereClause) {
      query = query.where(whereClause) as any;
    }

    // Sorting
    const sortColumn = departments[sortBy as keyof typeof departments];
    if (sortColumn) {
      query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn)) as any;
    }

    // Pagination
    const offset = (page - 1) * pageSize;
    const allDepartments = await query.limit(pageSize).offset(offset);

    console.log(`✓ Found ${allDepartments.length} departments (page ${page})`);

    return NextResponse.json({
      success: true,
      data: allDepartments,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching departments:', error);
    logError(error, { endpoint: '/api/departments', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

export async function POST(request: Request) {
  console.log('Step 1: POST /api/departments - Creating new department');

  try {
    const body = await request.json();
    console.log('Step 2: Validating request body');

    const validatedData = createDepartmentSchema.parse(body);

    // Check if parish exists
    const [parish] = await db
      .select()
      .from(parishes)
      .where(eq(parishes.id, validatedData.parishId))
      .limit(1);

    if (!parish) {
      return NextResponse.json(
        { success: false, error: 'Parish not found' },
        { status: 404 }
      );
    }

    // Check if code already exists for this parish
    const [existing] = await db
      .select()
      .from(departments)
      .where(
        and(
          eq(departments.parishId, validatedData.parishId),
          eq(departments.code, validatedData.code)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Department code already exists for this parish' },
        { status: 400 }
      );
    }

    console.log('Step 3: Inserting department into database');
    const [newDepartment] = await db
      .insert(departments)
      .values({
        ...validatedData,
        email: validatedData.email || null,
      })
      .returning();

    console.log(`✓ Department created: ${newDepartment.id}`);
    return NextResponse.json({
      success: true,
      data: newDepartment,
    }, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating department:', error);
    logError(error, { endpoint: '/api/departments', method: 'POST' });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}
```

### 2.2. Get/Update/Delete Route

**Fișier**: `src/app/api/departments/[id]/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { departments } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateDepartmentSchema = z.object({
  parishId: z.string().uuid().optional(),
  code: z.string().min(1).max(20).optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  headName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log(`Step 1: GET /api/departments/${params.id} - Fetching department`);

  try {
    const [department] = await db
      .select()
      .from(departments)
      .where(eq(departments.id, params.id))
      .limit(1);

    if (!department) {
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      );
    }

    console.log(`✓ Department found: ${department.id}`);
    return NextResponse.json({
      success: true,
      data: department,
    });
  } catch (error) {
    console.error('❌ Error fetching department:', error);
    logError(error, { endpoint: `/api/departments/${params.id}`, method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log(`Step 1: PUT /api/departments/${params.id} - Updating department`);

  try {
    const body = await request.json();
    const validatedData = updateDepartmentSchema.parse(body);

    // Check if department exists
    const [existing] = await db
      .select()
      .from(departments)
      .where(eq(departments.id, params.id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      );
    }

    // If code is being updated, check for duplicates
    if (validatedData.code && validatedData.code !== existing.code) {
      const [duplicate] = await db
        .select()
        .from(departments)
        .where(
          and(
            eq(departments.parishId, validatedData.parishId || existing.parishId),
            eq(departments.code, validatedData.code),
            eq(departments.id, params.id)
          )
        )
        .limit(1);

      if (duplicate) {
        return NextResponse.json(
          { success: false, error: 'Department code already exists for this parish' },
          { status: 400 }
        );
      }
    }

    const [updated] = await db
      .update(departments)
      .set({
        ...validatedData,
        email: validatedData.email !== undefined ? (validatedData.email || null) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(departments.id, params.id))
      .returning();

    console.log(`✓ Department updated: ${updated.id}`);
    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('❌ Error updating department:', error);
    logError(error, { endpoint: `/api/departments/${params.id}`, method: 'PUT' });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log(`Step 1: DELETE /api/departments/${params.id} - Deleting department`);

  try {
    const [existing] = await db
      .select()
      .from(departments)
      .where(eq(departments.id, params.id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      );
    }

    await db
      .delete(departments)
      .where(eq(departments.id, params.id));

    console.log(`✓ Department deleted: ${params.id}`);
    return NextResponse.json({
      success: true,
      message: 'Department deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting department:', error);
    logError(error, { endpoint: `/api/departments/${params.id}`, method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}
```

---

## 3. Hook React

**Fișier**: `src/hooks/useDepartments.ts`

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Department {
  id: string;
  parishId: string;
  code: string;
  name: string;
  description: string | null;
  headName: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface UseDepartmentsReturn {
  departments: Department[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  fetchDepartments: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    parishId?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  createDepartment: (data: Partial<Department>) => Promise<Department | null>;
  updateDepartment: (id: string, data: Partial<Department>) => Promise<Department | null>;
  deleteDepartment: (id: string) => Promise<boolean>;
}

export function useDepartments(): UseDepartmentsReturn {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseDepartmentsReturn['pagination']>(null);

  const fetchDepartments = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.parishId) queryParams.append('parishId', params.parishId);
      if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/departments?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch departments');
      }

      setDepartments(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch departments';
      setError(errorMessage);
      console.error('Error fetching departments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createDepartment = useCallback(async (data: Partial<Department>): Promise<Department | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create department');
      }

      // Refresh list
      await fetchDepartments();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create department';
      setError(errorMessage);
      console.error('Error creating department:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchDepartments]);

  const updateDepartment = useCallback(async (id: string, data: Partial<Department>): Promise<Department | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/departments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update department');
      }

      // Refresh list
      await fetchDepartments();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update department';
      setError(errorMessage);
      console.error('Error updating department:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchDepartments]);

  const deleteDepartment = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/departments/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete department');
      }

      // Refresh list
      await fetchDepartments();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete department';
      setError(errorMessage);
      console.error('Error deleting department:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchDepartments]);

  return {
    departments,
    loading,
    error,
    pagination,
    fetchDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  };
}
```

---

## 4. Pagina UI

**Fișier**: `src/app/[locale]/dashboard/modules/administration/departamente/page.tsx`

```typescript
'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { Modal } from '@/components/ui/Modal';
import { useDepartments, Department } from '@/hooks/useDepartments';
import { useParishes } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';

export default function DepartamentePage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');

  const {
    departments,
    loading,
    error,
    pagination,
    fetchDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  } = useDepartments();

  const { parishes, fetchParishes } = useParishes();

  const [searchTerm, setSearchTerm] = useState('');
  const [parishFilter, setParishFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    parishId: '',
    code: '',
    name: '',
    description: '',
    headName: '',
    phone: '',
    email: '',
    isActive: true,
  });

  useEffect(() => {
    fetchParishes();
  }, [fetchParishes]);

  useEffect(() => {
    fetchDepartments({
      page: currentPage,
      pageSize: 10,
      search: searchTerm || undefined,
      parishId: parishFilter || undefined,
      isActive: statusFilter ? statusFilter === 'active' : undefined,
      sortBy: 'name',
      sortOrder: 'asc',
    });
  }, [currentPage, searchTerm, parishFilter, statusFilter, fetchDepartments]);

  const handleCreate = async () => {
    if (!formData.parishId || !formData.code || !formData.name) {
      alert(t('fillRequiredFields'));
      return;
    }

    const result = await createDepartment({
      ...formData,
      description: formData.description || null,
      headName: formData.headName || null,
      phone: formData.phone || null,
      email: formData.email || null,
    });

    if (result) {
      setShowAddModal(false);
      setFormData({
        parishId: '',
        code: '',
        name: '',
        description: '',
        headName: '',
        phone: '',
        email: '',
        isActive: true,
      });
    }
  };

  const handleUpdate = async () => {
    if (!selectedDepartment) return;

    const result = await updateDepartment(selectedDepartment.id, {
      ...formData,
      description: formData.description || null,
      headName: formData.headName || null,
      phone: formData.phone || null,
      email: formData.email || null,
    });

    if (result) {
      setShowEditModal(false);
      setSelectedDepartment(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('confirmDelete'))) {
      await deleteDepartment(id);
    }
  };

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    setFormData({
      parishId: department.parishId,
      code: department.code,
      name: department.name,
      description: department.description || '',
      headName: department.headName || '',
      phone: department.phone || '',
      email: department.email || '',
      isActive: department.isActive,
    });
    setShowEditModal(true);
  };

  const columns = [
    { key: 'code', label: t('code'), sortable: true },
    { key: 'name', label: t('name'), sortable: true },
    {
      key: 'parish',
      label: t('parish'),
      sortable: false,
      render: (_: any, row: Department) => {
        const parish = parishes.find(p => p.id === row.parishId);
        return parish?.name || row.parishId;
      },
    },
    { key: 'headName', label: t('headName'), sortable: true },
    { key: 'phone', label: t('phone'), sortable: true },
    {
      key: 'isActive',
      label: t('status'),
      sortable: false,
      render: (value: boolean) => (
        <Badge variant={value ? 'success' : 'secondary'} size="sm">
          {value ? t('active') : t('inactive')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: t('actions'),
      sortable: false,
      render: (_: any, row: Department) => (
        <Dropdown
          trigger={
            <Button variant="ghost" size="sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </Button>
          }
          items={[
            { label: t('edit'), onClick: () => handleEdit(row) },
            { label: t('delete'), onClick: () => handleDelete(row.id), variant: 'danger' },
          ]}
          align="right"
        />
      ),
    },
  ];

  const breadcrumbs = [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: t('administration'), href: `/${locale}/dashboard/modules/administration` },
    { label: t('departamente') },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Breadcrumbs items={breadcrumbs} className="mb-2" />
          <h1 className="text-3xl font-bold text-text-primary">{t('departamente')}</h1>
        </div>
        <Button onClick={() => setShowAddModal(true)}>{t('add')} {t('departamente')}</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Input
              placeholder={t('search') + '...'}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="max-w-md"
            />
            <select
              value={parishFilter}
              onChange={(e) => {
                setParishFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border rounded"
            >
              <option value="">{t('allParishes')}</option>
              {parishes.map((parish) => (
                <option key={parish.id} value={parish.id}>
                  {parish.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border rounded"
            >
              <option value="">{t('allStatuses')}</option>
              <option value="active">{t('active')}</option>
              <option value="inactive">{t('inactive')}</option>
            </select>
          </div>
        </CardHeader>
        <CardBody>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {loading ? (
            <div>{t('loading')}</div>
          ) : (
            <>
              <Table
                data={departments}
                columns={columns}
                loading={loading}
              />
              {pagination && (
                <div className="flex items-center justify-between mt-4">
                  <div>
                    {t('page')} {pagination.page} {t('of')} {pagination.totalPages} ({pagination.total} {t('total')})
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      {t('previous')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={currentPage === pagination.totalPages}
                    >
                      {t('next')}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={`${t('add')} ${t('departamente')}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('parish')} *</label>
            <select
              value={formData.parishId}
              onChange={(e) => setFormData({ ...formData, parishId: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            >
              <option value="">{t('selectParish')}</option>
              {parishes.map((parish) => (
                <option key={parish.id} value={parish.id}>
                  {parish.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label={t('code')}
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
          />
          <Input
            label={t('name')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium mb-1">{t('description')}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              rows={3}
            />
          </div>
          <Input
            label={t('headName')}
            value={formData.headName}
            onChange={(e) => setFormData({ ...formData, headName: e.target.value })}
          />
          <Input
            label={t('phone')}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input
            label={t('email')}
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleCreate}>{t('create')}</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`${t('edit')} ${t('departamente')}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('parish')} *</label>
            <select
              value={formData.parishId}
              onChange={(e) => setFormData({ ...formData, parishId: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            >
              <option value="">{t('selectParish')}</option>
              {parishes.map((parish) => (
                <option key={parish.id} value={parish.id}>
                  {parish.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label={t('code')}
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
          />
          <Input
            label={t('name')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium mb-1">{t('description')}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              rows={3}
            />
          </div>
          <Input
            label={t('headName')}
            value={formData.headName}
            onChange={(e) => setFormData({ ...formData, headName: e.target.value })}
          />
          <Input
            label={t('phone')}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input
            label={t('email')}
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleUpdate}>{t('update')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
```

---

## 5. Traduceri

### 5.1. Traduceri Română

**Fișier**: `src/locales/ro/common.json`

Adaugă:
```json
{
  "departamente": "Departamente",
  "headName": "Șef Departament",
  "allParishes": "Toate Parohiile",
  "selectParish": "Selectează Parohia",
  "fillRequiredFields": "Te rugăm să completezi toate câmpurile obligatorii",
  "confirmDelete": "Ești sigur că vrei să ștergi acest departament?",
  "code": "Cod",
  "name": "Nume",
  "parish": "Parohie",
  "description": "Descriere"
}
```

### 5.2. Traduceri Engleză

**Fișier**: `src/locales/en/common.json`

Adaugă:
```json
{
  "departamente": "Departments",
  "headName": "Head of Department",
  "allParishes": "All Parishes",
  "selectParish": "Select Parish",
  "fillRequiredFields": "Please fill in all required fields",
  "confirmDelete": "Are you sure you want to delete this department?",
  "code": "Code",
  "name": "Name",
  "parish": "Parish",
  "description": "Description"
}
```

---

## 6. Checklist de Implementare

### Pas 1: Schema de Bază de Date
- [ ] Creează `database/schema/core/departments.ts`
- [ ] Exportă în `database/schema/core/index.ts`
- [ ] Rulează `npm run db:generate`
- [ ] Review SQL generat
- [ ] Rulează SQL manual în baza de date
- [ ] Verifică că tabelul a fost creat corect

### Pas 2: API Routes
- [ ] Creează `src/app/api/departments/route.ts`
- [ ] Implementează GET (list)
- [ ] Implementează POST (create)
- [ ] Creează `src/app/api/departments/[id]/route.ts`
- [ ] Implementează GET (by ID)
- [ ] Implementează PUT (update)
- [ ] Implementează DELETE (delete)
- [ ] Testează toate endpoint-urile cu Postman/Thunder Client

### Pas 3: Hook React
- [ ] Creează `src/hooks/useDepartments.ts`
- [ ] Implementează `fetchDepartments`
- [ ] Implementează `createDepartment`
- [ ] Implementează `updateDepartment`
- [ ] Implementează `deleteDepartment`
- [ ] Testează hook-ul într-un component de test

### Pas 4: Pagina UI
- [ ] Actualizează `src/app/[locale]/dashboard/modules/administration/departamente/page.tsx`
- [ ] Implementează listare cu tabelă
- [ ] Implementează filtrare
- [ ] Implementează căutare
- [ ] Implementează modal Create
- [ ] Implementează modal Edit
- [ ] Implementează ștergere
- [ ] Implementează paginare

### Pas 5: Traduceri
- [ ] Adaugă traduceri în `src/locales/ro/common.json`
- [ ] Adaugă traduceri în `src/locales/en/common.json`
- [ ] Verifică că toate cheile sunt folosite corect

### Pas 6: Testare
- [ ] Testează crearea unui departament
- [ ] Testează editarea unui departament
- [ ] Testează ștergerea unui departament
- [ ] Testează filtrarea după parohie
- [ ] Testează căutarea
- [ ] Testează paginarea
- [ ] Testează validările (câmpuri obligatorii)
- [ ] Testează duplicate code pentru aceeași parohie
- [ ] Testează error handling

---

## 7. Exemple de Request/Response

### 7.1. GET /api/departments

**Request**:
```
GET /api/departments?page=1&pageSize=10&parishId=xxx&search=catehism
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "parishId": "uuid",
      "code": "CAT",
      "name": "Catehism",
      "description": "Departament de catehism",
      "headName": "Ion Popescu",
      "phone": "0712345678",
      "email": "catehism@parohie.ro",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### 7.2. POST /api/departments

**Request**:
```json
{
  "parishId": "uuid",
  "code": "CAT",
  "name": "Catehism",
  "description": "Departament de catehism",
  "headName": "Ion Popescu",
  "phone": "0712345678",
  "email": "catehism@parohie.ro",
  "isActive": true
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "parishId": "uuid",
    "code": "CAT",
    "name": "Catehism",
    ...
  }
}
```

---

## 8. Probleme Potențiale și Soluții

### 8.1. Duplicate Code
**Problemă**: Codul departamentului trebuie să fie unic per parohie, nu global.

**Soluție**: Verifică duplicate în API route înainte de insert/update:
```typescript
const [existing] = await db
  .select()
  .from(departments)
  .where(
    and(
      eq(departments.parishId, validatedData.parishId),
      eq(departments.code, validatedData.code)
    )
  )
  .limit(1);
```

### 8.2. Foreign Key Constraint
**Problemă**: Dacă parohia este ștearsă, departamentele trebuie șterse automat.

**Soluție**: Folosește `onDelete: 'cascade'` în schema:
```typescript
parishId: uuid('parish_id').notNull().references(() => parishes.id, { onDelete: 'cascade' })
```

### 8.3. Validare Email
**Problemă**: Email-ul poate fi opțional, dar dacă este furnizat, trebuie să fie valid.

**Soluție**: Folosește Zod cu `.email().optional().or(z.literal(''))`:
```typescript
email: z.string().email().optional().or(z.literal(''))
```

---

## 9. Estimare Timp

- **Schema DB**: 30 min
- **API Routes**: 2-3 ore
- **Hook**: 1-2 ore
- **Pagina UI**: 3-4 ore
- **Traduceri**: 15 min
- **Testare**: 1-2 ore

**Total**: 8-12 ore

---

## 10. Următorii Pași După Implementare

1. Adaugă statistici (număr departamente per parohie)
2. Adaugă export Excel
3. Adaugă istoric modificări (audit log)
4. Adaugă permisiuni (cine poate crea/edita/șterge departamente)






