'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { WarehouseAddModal, WarehouseFormData } from '@/components/accounting/WarehouseAddModal';
import { WarehouseEditModal } from '@/components/accounting/WarehouseEditModal';
import { DeleteWarehouseDialog } from '@/components/accounting/DeleteWarehouseDialog';
import { WarehousesFiltersCard } from '@/components/accounting/WarehousesFiltersCard';
import { WarehousesTableCard } from '@/components/accounting/WarehousesTableCard';
import { getWarehousesTableColumns } from './WarehousesTableColumns';
import { useWarehouses, Warehouse } from '@/hooks/useWarehouses';
import { useParishes } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';
import { validateWarehouseForm, ValidationErrors, WarehouseType } from '@/lib/validations/warehouses';
import {
  createEmptyWarehouseFormData,
  warehouseToFormData,
} from '@/lib/utils/warehouses';

const PAGE_SIZE = 10;

interface WarehousesPageContentProps {
  locale: string;
}

/**
 * Warehouses page content component
 * Contains all the JSX/HTML that was previously in the page file
 * Separates presentation from routing and permission logic
 */
export function WarehousesPageContent({ locale }: WarehousesPageContentProps) {
  const t = useTranslations('common');

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
  const [formData, setFormData] = useState<WarehouseFormData>(createEmptyWarehouseFormData());
  const formErrorsRef = useRef<ValidationErrors>({});
  
  // Keep ref in sync with state for use in callbacks
  useEffect(() => {
    formErrorsRef.current = formErrors;
  }, [formErrors]);

  // Fetch parishes on mount
  useEffect(() => {
    fetchParishes({ all: true });
  }, [fetchParishes]);

  /**
   * Build fetch parameters object for warehouses API
   */
  const buildFetchParams = useCallback(
    (page: number = currentPage) => ({
      page,
      pageSize: PAGE_SIZE,
      search: searchTerm || undefined,
      parishId: parishFilter || undefined,
      type: (typeFilter || undefined) as WarehouseType | undefined,
      isActive: isActiveFilter === '' ? undefined : isActiveFilter === 'true',
    }),
    [currentPage, searchTerm, parishFilter, typeFilter, isActiveFilter]
  );

  // Fetch warehouses when filters or page changes
  useEffect(() => {
    fetchWarehouses(buildFetchParams());
  }, [buildFetchParams, fetchWarehouses]);

  // Reset form to empty state
  const resetForm = useCallback(() => {
    setFormData(createEmptyWarehouseFormData());
    setSelectedWarehouse(null);
    setFormErrors({});
  }, []);

  // Handle add button click
  const handleAdd = useCallback(() => {
    resetForm();
    setShowAddModal(true);
  }, [resetForm]);

  // Handle edit button click
  const handleEdit = useCallback((warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setFormData(warehouseToFormData(warehouse));
    setShowEditModal(true);
  }, []);

  // Validate and create warehouse
  const handleCreate = useCallback(async () => {
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
  }, [formData, t, createWarehouse, resetForm, buildFetchParams, fetchWarehouses]);

  // Validate and update warehouse
  const handleUpdate = useCallback(async () => {
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
  }, [selectedWarehouse, formData, t, updateWarehouse, buildFetchParams, fetchWarehouses]);

  // Delete warehouse
  const handleDelete = useCallback(
    async (id: string) => {
      const success = await deleteWarehouse(id);
      if (success) {
        setDeleteConfirm(null);
        // Refetch with current filters to maintain state
        fetchWarehouses(buildFetchParams());
      }
    },
    [deleteWarehouse, buildFetchParams, fetchWarehouses]
  );

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setParishFilter('');
    setTypeFilter('');
    setIsActiveFilter('');
    setCurrentPage(1);
  }, []);

  // Filter change handlers with page reset
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleParishFilterChange = useCallback((value: string) => {
    setParishFilter(value);
    setCurrentPage(1);
  }, []);

  const handleTypeFilterChange = useCallback((value: string) => {
    setTypeFilter(value);
    setCurrentPage(1);
  }, []);

  const handleIsActiveFilterChange = useCallback((value: string) => {
    setIsActiveFilter(value);
    setCurrentPage(1);
  }, []);

  // Close add modal
  const handleCloseAddModal = useCallback(() => {
    setShowAddModal(false);
    resetForm();
  }, [resetForm]);

  // Close edit modal
  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false);
    setSelectedWarehouse(null);
    setFormErrors({});
  }, []);

  // Handle form data change
  const handleFormDataChange = useCallback((data: WarehouseFormData) => {
    setFormData(data);
    // Clear errors when user modifies form (using ref to avoid dependency)
    if (Object.keys(formErrorsRef.current).length > 0) {
      setFormErrors({});
    }
  }, []);

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback((id: string) => {
    setDeleteConfirm(id);
  }, []);

  // Table columns configuration
  const columns = useMemo(
    () => getWarehousesTableColumns({
      t,
      onEdit: handleEdit,
      onDelete: handleDeleteConfirm,
    }),
    [t, handleEdit, handleDeleteConfirm]
  );

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
        onSearchChange={handleSearchChange}
        onParishFilterChange={handleParishFilterChange}
        onTypeFilterChange={handleTypeFilterChange}
        onIsActiveFilterChange={handleIsActiveFilterChange}
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
        onClose={handleCloseAddModal}
        onCancel={handleCloseAddModal}
        formData={formData}
        onFormDataChange={handleFormDataChange}
        parishes={parishes}
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
        errors={formErrors}
      />

      {/* Edit Modal */}
      <WarehouseEditModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        onCancel={handleCloseEditModal}
        formData={formData}
        onFormDataChange={handleFormDataChange}
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

