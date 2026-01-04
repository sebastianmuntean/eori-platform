'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Dropdown } from '@/components/ui/Dropdown';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterGrid, FilterClear, ParishFilter } from '@/components/ui/FilterGrid';
import { useFixedAssets, FixedAsset } from '@/hooks/useFixedAssets';
import { useParishes } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';
import { FIXED_ASSET_STATUS } from '@/lib/fixed-assets/constants';
import { formatMonetaryValue, formatDate } from '@/lib/fixed-assets/formatters';
import { getStatusBadgeVariant } from '@/lib/fixed-assets/helpers';
import { FixedAssetForm, FixedAssetFormData } from './FixedAssetForm';
import { validateFixedAssetForm } from '@/lib/fixed-assets/validation';

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
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');

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

  const [searchTerm, setSearchTerm] = useState('');
  const [parishFilter, setParishFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<FixedAsset | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<FixedAssetFormData>({
    parishId: '',
    inventoryNumber: '',
    name: '',
    description: '',
    category: defaultCategory || '',
    type: '',
    location: '',
    acquisitionDate: '',
    acquisitionValue: '',
    currentValue: '',
    depreciationMethod: '',
    usefulLifeYears: '',
    status: 'active',
    disposalDate: '',
    disposalValue: '',
    disposalReason: '',
    notes: '',
  });

  const pageTitle = tMenu(titleKey) || title;

  useEffect(() => {
    fetchParishes({ all: true });
  }, [fetchParishes]);

  useEffect(() => {
    const params: any = {
      page: currentPage,
      pageSize: 10,
      search: searchTerm || undefined,
      parishId: parishFilter || undefined,
      ...(category && { category }),
      ...filterParams,
    };
    fetchFixedAssets(params);
  }, [currentPage, searchTerm, parishFilter, category, fetchFixedAssets, filterParams]);

  const resetForm = useCallback(() => {
    setFormData({
      parishId: '',
      inventoryNumber: '',
      name: '',
      description: '',
      category: defaultCategory || '',
      type: '',
      location: '',
      acquisitionDate: '',
      acquisitionValue: '',
      currentValue: '',
      depreciationMethod: '',
      usefulLifeYears: '',
      status: filterParams.status as FixedAssetFormData['status'] || 'active',
      disposalDate: '',
      disposalValue: '',
      disposalReason: '',
      notes: '',
    });
    setSelectedAsset(null);
    setFormErrors({});
  }, [defaultCategory, filterParams.status]);

  const handleAdd = useCallback(() => {
    resetForm();
    setShowAddModal(true);
  }, [resetForm]);

  const handleEdit = useCallback((asset: FixedAsset) => {
    setSelectedAsset(asset);
    setFormData({
      parishId: asset.parishId,
      inventoryNumber: asset.inventoryNumber,
      name: asset.name,
      description: asset.description || '',
      category: asset.category || defaultCategory || '',
      type: asset.type || '',
      location: asset.location || '',
      acquisitionDate: asset.acquisitionDate || '',
      acquisitionValue: asset.acquisitionValue || '',
      currentValue: asset.currentValue || '',
      depreciationMethod: asset.depreciationMethod || '',
      usefulLifeYears: asset.usefulLifeYears?.toString() || '',
      status: asset.status,
      disposalDate: asset.disposalDate || '',
      disposalValue: asset.disposalValue || '',
      disposalReason: asset.disposalReason || '',
      notes: asset.notes || '',
    });
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
        const result = await updateFixedAsset(selectedAsset.id, formData);
        if (result) {
          setShowEditModal(false);
          setSelectedAsset(null);
          resetForm();
          fetchFixedAssets({ 
            page: currentPage, 
            pageSize: 10, 
            ...(category && { category }),
            ...filterParams 
          });
        }
      } else {
        const result = await createFixedAsset(formData);
        if (result) {
          setShowAddModal(false);
          resetForm();
          fetchFixedAssets({ 
            page: currentPage, 
            pageSize: 10, 
            ...(category && { category }),
            ...filterParams 
          });
        }
      }
    } finally {
      setIsSaving(false);
    }
  }, [selectedAsset, formData, currentPage, category, filterParams, fetchFixedAssets, createFixedAsset, updateFixedAsset, resetForm]);

  const handleDelete = useCallback(async () => {
    if (deleteConfirm) {
      const success = await deleteFixedAsset(deleteConfirm);
      if (success) {
        setDeleteConfirm(null);
        fetchFixedAssets({ 
          page: currentPage, 
          pageSize: 10, 
          ...(category && { category }),
          ...filterParams 
        });
      }
    }
  }, [deleteConfirm, currentPage, category, filterParams, fetchFixedAssets, deleteFixedAsset]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleParishFilterChange = useCallback((value: string) => {
    setParishFilter(value);
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setParishFilter('');
    setCurrentPage(1);
  }, []);

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

  const columns = useMemo(() => [
    { key: 'inventoryNumber', label: t('inventoryNumber') || 'Număr Inventar', sortable: true },
    { key: 'name', label: t('name') || 'Name', sortable: true },
    { key: 'location', label: t('location') || 'Location', sortable: false },
    {
      key: 'acquisitionDate',
      label: t('acquisitionDate') || 'Acquisition Date',
      sortable: false,
      render: formatDate,
    },
    {
      key: 'acquisitionValue',
      label: t('acquisitionValue') || 'Acquisition Value',
      sortable: false,
      render: formatMonetaryValue,
    },
    {
      key: 'currentValue',
      label: t('currentValue') || 'Current Value',
      sortable: false,
      render: formatMonetaryValue,
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

  const breadcrumbItems = [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: t('accounting') || 'Accounting', href: `/${locale}/dashboard/accounting` },
    { label: tMenu('fixedAssets') || 'Mijloace fixe', href: `/${locale}/dashboard/accounting/fixed-assets` },
    { label: pageTitle, href },
  ];

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
                onChange={(e) => handleSearchChange(e.target.value)}
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
              columns={columns}
              loading={loading}
            />

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <div className="text-sm text-text-secondary">
                  {t('showing')} {(pagination.page - 1) * pagination.pageSize + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.total)} {t('of')} {pagination.total}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                  >
                    {t('previous')}
                  </Button>
                  <span className="text-sm text-text-secondary">
                    {t('page')} {pagination.page} {t('of')} {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === pagination.totalPages || loading}
                  >
                    {t('next')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title={t('addFixedAsset') || 'Add Fixed Asset'}
        size="lg"
      >
        <div className="space-y-4 max-h-[80vh] overflow-y-auto">
          <FixedAssetForm
            formData={formData}
            onChange={handleFormChange}
            parishes={parishes}
            defaultCategory={defaultCategory}
            showCategory={showCategory}
            errors={formErrors}
          />
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => { setShowAddModal(false); resetForm(); }}
              disabled={isSaving}
            >
              {t('cancel') || 'Cancel'}
            </Button>
            <Button onClick={handleSave} disabled={isSaving || loading}>
              {isSaving ? (t('saving') || 'Saving...') : (t('save') || 'Save')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
        title={t('editFixedAsset') || 'Edit Fixed Asset'}
        size="lg"
      >
        <div className="space-y-4 max-h-[80vh] overflow-y-auto">
          <FixedAssetForm
            formData={formData}
            onChange={handleFormChange}
            parishes={parishes}
            defaultCategory={defaultCategory}
            showCategory={showCategory}
            errors={formErrors}
          />
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => { setShowEditModal(false); resetForm(); }}
              disabled={isSaving}
            >
              {t('cancel') || 'Cancel'}
            </Button>
            <Button onClick={handleSave} disabled={isSaving || loading}>
              {isSaving ? (t('saving') || 'Saving...') : (t('save') || 'Save')}
            </Button>
          </div>
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

