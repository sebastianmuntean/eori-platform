'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { WarehouseAddModal, WarehouseFormData } from '@/components/accounting/WarehouseAddModal';
import { WarehouseEditModal } from '@/components/accounting/WarehouseEditModal';
import { DeleteWarehouseDialog } from '@/components/accounting/DeleteWarehouseDialog';
import { WarehousesFiltersCard } from '@/components/accounting/WarehousesFiltersCard';
import { WarehousesTableCard } from '@/components/accounting/WarehousesTableCard';
import { useWarehouses, Warehouse } from '@/hooks/useWarehouses';
import { useParishes } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ACCOUNTING_PERMISSIONS } from '@/lib/permissions/accounting';
import { validateWarehouseForm, ValidationErrors, WarehouseType } from '@/lib/validations/warehouses';

export default function WarehousesPage() {
  const { loading: permissionLoading } = useRequirePermission(ACCOUNTING_PERMISSIONS.WAREHOUSES_VIEW);
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('warehouses'));

  // All hooks must be called before any conditional returns
  const {
    warehouses,
    loading,
    error,
    pagination,
    fetchWarehouses,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
  } = useWarehouses();

  const { parishes, fetchParishes } = useParishes();

  const [searchTerm, setSearchTerm] = useState('');
  const [parishFilter, setParishFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<ValidationErrors>({});
  const [formData, setFormData] = useState<WarehouseFormData>({
    parishId: '',
    code: '',
    name: '',
    type: 'general',
    address: '',
    responsibleName: '',
    phone: '',
    email: '',
    invoiceSeries: '',
    isActive: true,
  });

  useEffect(() => {
    if (permissionLoading) return;
    fetchParishes({ all: true });
  }, [permissionLoading, fetchParishes]);

  /**
   * Build fetch parameters object for warehouses API
   */
  const buildFetchParams = useMemo(() => {
    return (page: number = currentPage) => ({
      page,
      pageSize: 10,
      search: searchTerm || undefined,
      parishId: parishFilter || undefined,
      type: (typeFilter || undefined) as WarehouseType | undefined,
      isActive: isActiveFilter === '' ? undefined : isActiveFilter === 'true',
    });
  }, [currentPage, searchTerm, parishFilter, typeFilter, isActiveFilter]);

  useEffect(() => {
    if (permissionLoading) return;
    fetchWarehouses(buildFetchParams());
  }, [permissionLoading, buildFetchParams, fetchWarehouses]);

  const handleAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEdit = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setFormData({
      parishId: warehouse.parishId,
      code: warehouse.code,
      name: warehouse.name,
      type: warehouse.type,
      address: warehouse.address || '',
      responsibleName: warehouse.responsibleName || '',
      phone: warehouse.phone || '',
      email: warehouse.email || '',
      invoiceSeries: warehouse.invoiceSeries || '',
      isActive: warehouse.isActive,
    });
    setShowEditModal(true);
  };

  const handleCreate = async () => {
    // Validate form
    const errors = validateWarehouseForm(formData, t);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);
    try {
      const result = await createWarehouse(formData);
      if (result) {
        setShowAddModal(false);
        resetForm();
        // After creating, go to first page and refetch with current filters
        setCurrentPage(1);
        fetchWarehouses(buildFetchParams(1));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedWarehouse) return;

    // Validate form
    const errors = validateWarehouseForm(formData, t);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);
    try {
      const result = await updateWarehouse(selectedWarehouse.id, formData);
      if (result) {
        setShowEditModal(false);
        setSelectedWarehouse(null);
        // Refetch with current filters to maintain state
        fetchWarehouses(buildFetchParams());
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteWarehouse(id);
    if (success) {
      setDeleteConfirm(null);
      // Refetch with current filters to maintain state
      fetchWarehouses(buildFetchParams());
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setParishFilter('');
    setTypeFilter('');
    setIsActiveFilter('');
    setCurrentPage(1);
  };

  const resetForm = () => {
    setFormData({
      parishId: '',
      code: '',
      name: '',
      type: 'general',
      address: '',
      responsibleName: '',
      phone: '',
      email: '',
      invoiceSeries: '',
      isActive: true,
    });
    setSelectedWarehouse(null);
    setFormErrors({});
  };

  const columns = useMemo(() => [
    { key: 'code' as keyof Warehouse, label: t('code') || 'Code', sortable: true },
    { key: 'name' as keyof Warehouse, label: t('name') || 'Name', sortable: true },
    {
      key: 'type' as keyof Warehouse,
      label: t('type') || 'Type',
      sortable: false,
      render: (value: string) => (
        <Badge variant="secondary" size="sm">
          {value}
        </Badge>
      ),
    },
    {
      key: 'invoiceSeries' as keyof Warehouse,
      label: t('invoiceSeries') || 'Serie Factură',
      sortable: false,
      render: (value: string | null) => (
        value ? (
          <Badge variant="secondary" size="sm">
            {value}
          </Badge>
        ) : (
          <span className="text-text-muted text-sm">-</span>
        )
      ),
    },
    {
      key: 'isActive' as keyof Warehouse,
      label: t('status') || 'Status',
      sortable: false,
      render: (value: boolean) => (
        <Badge variant={value ? 'success' : 'secondary'} size="sm">
          {value ? t('active') || 'Active' : t('inactive') || 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions' as keyof Warehouse,
      label: t('actions') || 'Actions',
      sortable: false,
      render: (_: any, row: Warehouse) => (
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
        />
      ),
    },
  ], [t]);

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return <div>{t('loading')}</div>;
  }

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: t('accounting') || 'Accounting', href: `/${locale}/dashboard/accounting` },
          { label: t('warehouses') || 'Warehouses', href: `/${locale}/dashboard/accounting/warehouses` },
        ]}
        title={t('warehouses') || 'Warehouses'}
        action={<Button onClick={handleAdd}>{t('add') || 'Add'}</Button>}
      />

      {/* Filters */}
      <WarehousesFiltersCard
        searchTerm={searchTerm}
        parishFilter={parishFilter}
        typeFilter={typeFilter}
        isActiveFilter={isActiveFilter}
        parishes={parishes}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setCurrentPage(1);
        }}
        onParishFilterChange={(value) => {
          setParishFilter(value);
          setCurrentPage(1);
        }}
        onTypeFilterChange={(value) => {
          setTypeFilter(value);
          setCurrentPage(1);
        }}
        onIsActiveFilterChange={(value) => {
          setIsActiveFilter(value);
          setCurrentPage(1);
        }}
        onClearFilters={handleClearFilters}
      />

      {/* Warehouses Table */}
      <WarehousesTableCard
        data={warehouses}
        columns={columns}
        loading={loading}
        error={error}
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        emptyMessage={t('noData') || 'No warehouses available'}
      />

      {/* Add Modal */}
      <WarehouseAddModal
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
        onFormDataChange={(data) => {
          setFormData(data);
          // Clear errors when user modifies form
          if (Object.keys(formErrors).length > 0) {
            setFormErrors({});
          }
        }}
        parishes={parishes}
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
        errors={formErrors}
      />

      {/* Edit Modal */}
      <WarehouseEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedWarehouse(null);
          setFormErrors({});
        }}
        onCancel={() => {
          setShowEditModal(false);
          setSelectedWarehouse(null);
          setFormErrors({});
        }}
        formData={formData}
        onFormDataChange={(data) => {
          setFormData(data);
          // Clear errors when user modifies form
          if (Object.keys(formErrors).length > 0) {
            setFormErrors({});
          }
        }}
        parishes={parishes}
        onSubmit={handleUpdate}
        isSubmitting={isSubmitting}
        errors={formErrors}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteWarehouseDialog
        isOpen={!!deleteConfirm}
        warehouseId={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
      />
    </PageContainer>
  );
}

