'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { DeaneryAddModal, DeaneryFormData } from '@/components/administration/DeaneryAddModal';
import { DeaneryEditModal } from '@/components/administration/DeaneryEditModal';
import { DeleteDeaneryDialog } from '@/components/administration/DeleteDeaneryDialog';
import { DeaneriesFiltersCard } from '@/components/administration/DeaneriesFiltersCard';
import { DeaneriesTableCard } from '@/components/administration/DeaneriesTableCard';
import { useDeaneries, Deanery } from '@/hooks/useDeaneries';
import { useDioceses } from '@/hooks/useDioceses';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ADMINISTRATION_PERMISSIONS } from '@/lib/permissions/administration';

export default function DeaneriesPage() {
  const { loading: permissionLoading } = useRequirePermission(ADMINISTRATION_PERMISSIONS.DEANERIES_VIEW);
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('deaneries'));

  const {
    deaneries,
    loading,
    error,
    pagination,
    fetchDeaneries,
    createDeanery,
    updateDeanery,
    deleteDeanery,
  } = useDeaneries();

  const { dioceses, loading: diocesesLoading, fetchDioceses } = useDioceses();

  const [searchTerm, setSearchTerm] = useState('');
  const [dioceseFilter, setDioceseFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDeanery, setSelectedDeanery] = useState<Deanery | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<DeaneryFormData>({
    dioceseId: '',
    code: '',
    name: '',
    address: '',
    city: '',
    county: '',
    deanName: '',
    phone: '',
    email: '',
    isActive: true,
  });

  useEffect(() => {
    fetchDioceses({ all: true });
  }, [fetchDioceses]);

  useEffect(() => {
    fetchDeaneries({
      page: currentPage,
      pageSize: 10,
      search: searchTerm || undefined,
      dioceseId: dioceseFilter || undefined,
      sortBy: 'name',
      sortOrder: 'asc',
    });
  }, [currentPage, searchTerm, dioceseFilter, fetchDeaneries]);

  const resetForm = useCallback(() => {
    setFormData({
      dioceseId: '',
      code: '',
      name: '',
      address: '',
      city: '',
      county: '',
      deanName: '',
      phone: '',
      email: '',
      isActive: true,
    });
    setFormError(null);
    setFormErrors({});
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.dioceseId.trim()) {
      errors.dioceseId = t('required') || 'This field is required';
    }

    if (!formData.code.trim()) {
      errors.code = t('required') || 'This field is required';
    }

    if (!formData.name.trim()) {
      errors.name = t('required') || 'This field is required';
    }

    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = t('invalidEmail') || 'Invalid email format';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, t]);

  const handleCreate = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const result = await createDeanery(formData);
      if (result) {
        setShowAddModal(false);
        resetForm();
      } else {
        setFormError(t('createError') || 'Failed to create deanery. Please try again.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('createError') || 'Failed to create deanery';
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, createDeanery, resetForm, t]);

  const handleUpdate = useCallback(async () => {
    if (!selectedDeanery) return;

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const result = await updateDeanery(selectedDeanery.id, formData);
      if (result) {
        setShowEditModal(false);
        setSelectedDeanery(null);
        resetForm();
      } else {
        setFormError(t('updateError') || 'Failed to update deanery. Please try again.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('updateError') || 'Failed to update deanery';
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedDeanery, formData, validateForm, updateDeanery, resetForm, t]);

  const handleDelete = useCallback(async (id: string) => {
    setIsDeleting(true);
    try {
      const result = await deleteDeanery(id);
      if (result) {
        setDeleteConfirm(null);
      }
    } catch (err) {
      // Error is handled by the hook and displayed in the table
      console.error('Failed to delete deanery:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteDeanery]);

  const handleEdit = useCallback((deanery: Deanery) => {
    setSelectedDeanery(deanery);
    setFormData({
      dioceseId: deanery.dioceseId,
      code: deanery.code,
      name: deanery.name,
      address: deanery.address || '',
      city: deanery.city || '',
      county: deanery.county || '',
      deanName: deanery.deanName || '',
      phone: deanery.phone || '',
      email: deanery.email || '',
      isActive: deanery.isActive,
    });
    setFormErrors({});
    setFormError(null);
    setShowEditModal(true);
  }, []);

  const columns = useMemo<Column<Deanery>[]>(() => [
    { key: 'code' as keyof Deanery, label: t('code') || 'Code', sortable: true },
    { key: 'name' as keyof Deanery, label: t('name') || 'Name', sortable: true },
    { key: 'city' as keyof Deanery, label: t('city') || 'City', sortable: true, render: (value: string | null) => value || '-' },
    { key: 'county' as keyof Deanery, label: t('county') || 'County', sortable: true, render: (value: string | null) => value || '-' },
    {
      key: 'isActive' as keyof Deanery,
      label: t('status') || 'Status',
      sortable: false,
      render: (value: boolean) => (
        <Badge variant={value ? 'success' : 'secondary'} size="sm">
          {value ? (t('active') || 'Active') : (t('inactive') || 'Inactive')}
        </Badge>
      ),
    },
    {
      key: 'actions' as keyof Deanery,
      label: t('actions') || 'Actions',
      sortable: false,
      render: (_: any, row: Deanery) => (
        <Dropdown
          trigger={
            <Button variant="ghost" size="sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </Button>
          }
          items={[
            { label: t('edit') || 'Edit', onClick: () => handleEdit(row) },
            { label: t('delete') || 'Delete', onClick: () => setDeleteConfirm(row.id), variant: 'danger' },
          ]}
          align="right"
        />
      ),
    },
  ], [t, handleEdit]);

  if (permissionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleDioceseFilterChange = useCallback((value: string) => {
    setDioceseFilter(value);
    setCurrentPage(1);
  }, []);

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: t('administration'), href: `/${locale}/dashboard/administration` },
          { label: t('protopopiate') || 'Deaneries' },
        ]}
        title={t('protopopiate') || 'Deaneries'}
        action={<Button onClick={() => setShowAddModal(true)}>{t('add')} {t('protopopiate')}</Button>}
      />

      {/* Filters */}
      <DeaneriesFiltersCard
        searchTerm={searchTerm}
        dioceseFilter={dioceseFilter}
        dioceses={dioceses}
        diocesesLoading={diocesesLoading}
        onSearchChange={handleSearchChange}
        onDioceseFilterChange={handleDioceseFilterChange}
      />

      {/* Deaneries Table */}
      <DeaneriesTableCard
        data={deaneries}
        columns={columns}
        loading={loading}
        error={error}
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        emptyMessage={t('noData') || 'No deaneries available'}
      />

      {/* Add Modal */}
      <DeaneryAddModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        onCancel={() => {
          setShowAddModal(false);
          resetForm();
        }}
        formData={formData}
        onFormDataChange={setFormData}
        dioceses={dioceses}
        diocesesLoading={diocesesLoading}
        formErrors={formErrors}
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
        error={formError}
      />

      {/* Edit Modal */}
      <DeaneryEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedDeanery(null);
          resetForm();
        }}
        onCancel={() => {
          setShowEditModal(false);
          setSelectedDeanery(null);
          resetForm();
        }}
        formData={formData}
        onFormDataChange={setFormData}
        dioceses={dioceses}
        diocesesLoading={diocesesLoading}
        formErrors={formErrors}
        onSubmit={handleUpdate}
        isSubmitting={isSubmitting}
        error={formError}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDeaneryDialog
        isOpen={!!deleteConfirm}
        deaneryId={deleteConfirm}
        onClose={() => {
          setDeleteConfirm(null);
          setFormError(null);
        }}
        onConfirm={handleDelete}
      />
    </PageContainer>
  );
}

