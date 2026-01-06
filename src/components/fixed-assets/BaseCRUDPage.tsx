'use client';

import { useParams } from 'next/navigation';
import { useState, useMemo, useCallback } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Table, Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Dropdown } from '@/components/ui/Dropdown';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterGrid, FilterClear, ParishFilter } from '@/components/ui/FilterGrid';
import { useFixedAssets, FixedAsset } from '@/hooks/useFixedAssets';
import { useFixedAssetsFilters } from '@/hooks/useFixedAssetsFilters';
import { useTranslations } from 'next-intl';
import { FixedAssetForm, FixedAssetFormData } from './FixedAssetForm';
import { validateFixedAssetForm } from '@/lib/fixed-assets/validation';
import { FixedAssetCategory } from '@/lib/fixed-assets/constants';
import { useFixedAssetsTableColumns, TableColumn } from './FixedAssetsTableColumns';
import { FixedAssetsPagination } from './FixedAssetsPagination';
import { useFixedAssetsBreadcrumbs } from '@/lib/fixed-assets/breadcrumbs';
import { ModalFooter } from './ModalFooter';
import { createInitialFormData, assetToFormData, formDataToCreateData, formDataToUpdateData } from '@/lib/fixed-assets/formHelpers';
import { usePageLocale } from '@/hooks/usePageLocale';
import { usePageTitle } from '@/hooks/usePageTitle';

export interface BaseCRUDPageProps {
  title: string;
  titleKey: string;
  href: string;
  category?: string;
  filterParams?: {
    status?: string;
    category?: string;
  };
  defaultCategory?: string;
  showCategory?: boolean;
}

// Re-export for backward compatibility
export type ReportPageWithCRUDProps = BaseCRUDPageProps;

/**
 * Base CRUD page component for fixed assets
 * Eliminates duplication between RegisterPageWithCRUD and ReportPageWithCRUD
 */
export function BaseCRUDPage({
  title,
  titleKey,
  href,
  category,
  filterParams = {},
  defaultCategory,
  showCategory = true,
}: BaseCRUDPageProps) {
  const { locale } = usePageLocale();
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');

  // Use the centralized filters hook
  const {
    fixedAssets,
    parishes,
    loading,
    error,
    pagination,
    searchTerm,
    parishFilter,
    handleSearchChange,
    handleParishFilterChange,
    handleClearFilters,
    handlePageChange,
    refreshData,
  } = useFixedAssetsFilters({
    category,
    filterParams,
  });

  // CRUD operations
  const {
    createFixedAsset,
    updateFixedAsset,
    deleteFixedAsset,
  } = useFixedAssets();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<FixedAsset | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const defaultStatus = (filterParams.status as FixedAssetFormData['status']) || 'active';
  const [formData, setFormData] = useState<FixedAssetFormData>(
    createInitialFormData(defaultCategory, defaultStatus)
  );

  const pageTitle = tMenu(titleKey) || title;
  usePageTitle(pageTitle);

  const resetForm = useCallback(() => {
    setFormData(createInitialFormData(defaultCategory, defaultStatus));
    setSelectedAsset(null);
    setFormErrors({});
  }, [defaultCategory, defaultStatus]);

  const handleAdd = useCallback(() => {
    resetForm();
    setShowAddModal(true);
  }, [resetForm]);

  const handleEdit = useCallback((asset: FixedAsset) => {
    setSelectedAsset(asset);
    setFormData(assetToFormData(asset, defaultCategory));
    setFormErrors({});
    setShowEditModal(true);
  }, [defaultCategory]);

  const handleSave = useCallback(async () => {
    // Validate form
    const errors = validateFixedAssetForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSaving(true);
    setFormErrors({});

    try {
      if (selectedAsset) {
        const result = await updateFixedAsset(selectedAsset.id, formDataToUpdateData(formData));
        if (result) {
          setShowEditModal(false);
          setSelectedAsset(null);
          resetForm();
          refreshData();
        }
      } else {
        const result = await createFixedAsset(formDataToCreateData(formData));
        if (result) {
          setShowAddModal(false);
          resetForm();
          refreshData();
        }
      }
    } finally {
      setIsSaving(false);
    }
  }, [selectedAsset, formData, createFixedAsset, updateFixedAsset, resetForm, refreshData]);

  const handleDelete = useCallback(async () => {
    if (deleteConfirm) {
      const success = await deleteFixedAsset(deleteConfirm);
      if (success) {
        setDeleteConfirm(null);
        refreshData();
      }
    }
  }, [deleteConfirm, deleteFixedAsset, refreshData]);

  const handleFormChange = useCallback((data: Partial<FixedAssetFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
    // Clear errors for changed fields
    if (Object.keys(formErrors).length > 0) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        Object.keys(data).forEach(key => {
          delete newErrors[key];
        });
        return newErrors;
      });
    }
  }, [formErrors]);

  // Use centralized table columns hook
  const baseColumns = useFixedAssetsTableColumns();

  // Add actions column with dropdown
  const columns = useMemo(() => {
    const actionsColumn: TableColumn = {
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
    };
    return [...baseColumns, actionsColumn];
  }, [baseColumns, t, handleEdit]);

  // Use centralized breadcrumbs hook
  const breadcrumbItems = useFixedAssetsBreadcrumbs(locale, pageTitle, href);

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbItems} />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{pageTitle}</h1>
            <Button onClick={handleAdd} disabled={loading}>
              {t('add') || 'Add'}
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="flex gap-4">
              <SearchInput
                value={searchTerm}
                onChange={(value) => handleSearchChange(value)}
                placeholder={t('search') || 'Search...'}
              />
            </div>

            <FilterGrid>
              <ParishFilter
                value={parishFilter}
                onChange={handleParishFilterChange}
                parishes={parishes}
              />
              <FilterClear onClear={handleClearFilters} />
            </FilterGrid>

            {error && (
              <div className="p-4 bg-danger/10 text-danger rounded">
                {error}
              </div>
            )}

            <Table
              data={fixedAssets}
              columns={columns as Column<FixedAsset>[]}
            />

            {pagination && (
              <FixedAssetsPagination
                pagination={pagination}
                loading={loading}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </CardBody>
      </Card>

      {/* Add Modal - Full Screen */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title={t('addFixedAsset') || 'Add Fixed Asset'}
        size="full"
      >
        <div className="flex flex-col" style={{ height: 'calc(98vh - 80px)' }}>
          <div className="flex-1 overflow-y-auto pr-2">
            <FixedAssetForm
              formData={formData}
              onChange={handleFormChange}
              parishes={parishes}
              defaultCategory={defaultCategory as FixedAssetCategory | undefined}
              showCategory={showCategory}
              errors={formErrors}
            />
          </div>
          <ModalFooter
            onCancel={() => {
              setShowAddModal(false);
              resetForm();
            }}
            onSave={handleSave}
            isSaving={isSaving}
            loading={loading}
          />
        </div>
      </Modal>

      {/* Edit Modal - Full Screen */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
        title={t('editFixedAsset') || 'Edit Fixed Asset'}
        size="full"
      >
        <div className="flex flex-col" style={{ height: 'calc(98vh - 80px)' }}>
          <div className="flex-1 overflow-y-auto pr-2">
            <FixedAssetForm
              formData={formData}
              onChange={handleFormChange}
              parishes={parishes}
              defaultCategory={defaultCategory as FixedAssetCategory | undefined}
              showCategory={showCategory}
              errors={formErrors}
            />
          </div>
          <ModalFooter
            onCancel={() => {
              setShowEditModal(false);
              resetForm();
            }}
            onSave={handleSave}
            isSaving={isSaving}
            loading={loading}
          />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={t('confirmDelete') || 'Confirm Delete'}
      >
        <div className="space-y-4">
          <p>{t('confirmDeleteMessage') || 'Are you sure you want to delete this fixed asset? This action cannot be undone.'}</p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={loading}>
              {t('cancel') || 'Cancel'}
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={loading}>
              {loading ? (t('deleting') || 'Deleting...') : (t('delete') || 'Delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

