'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { useFixedAssets, FixedAsset } from '@/hooks/useFixedAssets';
import { useParishes } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';
import { getStatusBadgeVariant } from '@/lib/fixed-assets/helpers';
import {
  formDataToCreateData,
  formDataToUpdateData,
  assetToFormData,
  createInitialFormData,
} from '@/lib/fixed-assets/formHelpers';
import { FixedAssetAddModal } from '@/components/accounting/FixedAssetAddModal';
import { FixedAssetEditModal } from '@/components/accounting/FixedAssetEditModal';
import { DeleteFixedAssetDialog } from '@/components/accounting/DeleteFixedAssetDialog';
import { FixedAssetsFiltersCard } from '@/components/accounting/FixedAssetsFiltersCard';
import { FixedAssetsTableCard } from '@/components/accounting/FixedAssetsTableCard';
import { FixedAssetFormData } from '@/components/fixed-assets/FixedAssetForm';

const PAGE_SIZE = 10;

type StatusFilter = 'active' | 'inactive' | 'disposed' | 'damaged' | '';

interface FixedAssetsManagePageContentProps {
  locale: string;
}

/**
 * Fixed Assets Manage page content component
 * Contains all the JSX/HTML that was previously in the page file
 * Separates presentation from routing and permission logic
 */
export function FixedAssetsManagePageContent({ locale }: FixedAssetsManagePageContentProps) {
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');

  // All hooks must be called before any conditional returns
  const {
    fixedAssets,
    loading,
    error,
    pagination,
    fetchFixedAssets,
    createFixedAsset,
    updateFixedAsset,
    deleteFixedAsset,
  } = useFixedAssets();

  const { parishes, fetchParishes } = useParishes();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [parishFilter, setParishFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<FixedAsset | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<FixedAssetFormData>(createInitialFormData());

  useEffect(() => {
    fetchParishes({ all: true });
  }, [fetchParishes]);

  // Build filter params - memoized to prevent unnecessary re-renders
  const filterParams = useMemo(
    () => ({
      page: currentPage,
      pageSize: PAGE_SIZE,
      search: searchTerm || undefined,
      parishId: parishFilter || undefined,
      category: categoryFilter || undefined,
      status: (statusFilter || undefined) as 'active' | 'inactive' | 'disposed' | 'damaged' | undefined,
    }),
    [currentPage, searchTerm, parishFilter, categoryFilter, statusFilter]
  );

  useEffect(() => {
    fetchFixedAssets(filterParams);
  }, [filterParams, fetchFixedAssets]);

  // Refresh function to explicitly refetch data
  const refreshFixedAssets = useCallback(() => {
    fetchFixedAssets(filterParams);
  }, [filterParams, fetchFixedAssets]);

  const resetForm = useCallback(() => {
    setFormData(createInitialFormData());
    setSelectedAsset(null);
  }, []);

  // Handlers
  const handleAdd = useCallback(() => {
    resetForm();
    setShowAddModal(true);
  }, [resetForm]);

  const handleEdit = useCallback((asset: FixedAsset) => {
    setSelectedAsset(asset);
    setFormData(assetToFormData(asset));
    setShowEditModal(true);
  }, []);

  const handleCreate = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const result = await createFixedAsset(formDataToCreateData(formData));
      if (result) {
        setShowAddModal(false);
        resetForm();
        // Reset to page 1 and refresh with page 1 params
        setCurrentPage(1);
        fetchFixedAssets({
          ...filterParams,
          page: 1,
        });
      }
    } catch (error) {
      console.error('Error creating fixed asset:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, createFixedAsset, resetForm, filterParams, fetchFixedAssets]);

  const handleUpdate = useCallback(async () => {
    if (!selectedAsset) return;
    setIsSubmitting(true);
    try {
      const result = await updateFixedAsset(selectedAsset.id, formDataToUpdateData(formData));
      if (result) {
        setShowEditModal(false);
        setSelectedAsset(null);
        refreshFixedAssets();
      }
    } catch (error) {
      console.error('Error updating fixed asset:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedAsset, formData, updateFixedAsset, refreshFixedAssets]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const success = await deleteFixedAsset(id);
        if (success) {
          setDeleteConfirm(null);
          refreshFixedAssets();
        }
      } catch (error) {
        console.error('Error deleting fixed asset:', error);
      }
    },
    [deleteFixedAsset, refreshFixedAssets]
  );

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setParishFilter('');
    setCategoryFilter('');
    setStatusFilter('');
    setCurrentPage(1);
  }, []);

  // Filter change handler factory to reduce duplication
  const createFilterChangeHandler = useCallback(
    <T extends string>(setter: (value: T) => void) => (value: T) => {
      setter(value);
      setCurrentPage(1);
    },
    []
  );

  // Status filter handler (needs type casting)
  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value as StatusFilter);
    setCurrentPage(1);
  }, []);

  // Modal close handlers to reduce duplication
  const handleCloseAddModal = useCallback(() => {
    setShowAddModal(false);
    resetForm();
  }, [resetForm]);

  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false);
    setSelectedAsset(null);
  }, []);

  const columns = useMemo(() => [
    { key: 'inventoryNumber', label: t('inventoryNumber') || 'Număr Inventar', sortable: true },
    { key: 'name', label: t('name') || 'Name', sortable: true },
    {
      key: 'category',
      label: t('category') || 'Category',
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
      key: 'status',
      label: t('status') || 'Status',
      sortable: false,
      render: (value: string) => (
        <Badge variant={getStatusBadgeVariant(value)} size="sm">
          {value}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: t('actions') || 'Actions',
      sortable: false,
      render: (_: any, row: FixedAsset) => (
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
  ], [t, handleEdit]);

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: t('accounting') || 'Accounting', href: `/${locale}/dashboard/accounting` },
          { label: tMenu('fixedAssets') || 'Mijloace fixe', href: `/${locale}/dashboard/accounting/fixed-assets` },
          { label: tMenu('fixedAssetsManagement') || 'Gestionare' },
        ]}
        title={tMenu('fixedAssetsManagement') || 'Mijloace fixe si obiecte de inventar'}
        action={<Button onClick={handleAdd}>{t('add') || 'Add'}</Button>}
      />

      {/* Filters */}
      <FixedAssetsFiltersCard
        searchTerm={searchTerm}
        parishFilter={parishFilter}
        categoryFilter={categoryFilter}
        statusFilter={statusFilter}
        parishes={parishes}
        onSearchChange={createFilterChangeHandler(setSearchTerm)}
        onParishFilterChange={createFilterChangeHandler(setParishFilter)}
        onCategoryFilterChange={createFilterChangeHandler(setCategoryFilter)}
        onStatusFilterChange={handleStatusFilterChange}
        onClearFilters={handleClearFilters}
      />

      {/* Table */}
      <FixedAssetsTableCard
        data={fixedAssets}
        columns={columns}
        loading={loading}
        error={error}
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        emptyMessage={t('noData') || 'No fixed assets available'}
      />

      {/* Add Modal */}
      <FixedAssetAddModal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        onCancel={handleCloseAddModal}
        formData={formData}
        onFormDataChange={setFormData}
        parishes={parishes}
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
      />

      {/* Edit Modal */}
      <FixedAssetEditModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        onCancel={handleCloseEditModal}
        formData={formData}
        onFormDataChange={setFormData}
        parishes={parishes}
        onSubmit={handleUpdate}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteFixedAssetDialog
        isOpen={!!deleteConfirm}
        assetId={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
      />
    </PageContainer>
  );
}

