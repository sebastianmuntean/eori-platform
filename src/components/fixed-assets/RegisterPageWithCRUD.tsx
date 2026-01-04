'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Dropdown } from '@/components/ui/Dropdown';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterGrid, FilterClear, ParishFilter } from '@/components/ui/FilterGrid';
import { useFixedAssets, FixedAsset } from '@/hooks/useFixedAssets';
import { useParishes } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';
import { FixedAssetCategory, CATEGORY_TRANSLATION_KEYS, FIXED_ASSET_STATUS } from '@/lib/fixed-assets/constants';
import { formatMonetaryValue, formatDate } from '@/lib/fixed-assets/formatters';
import { getCategoryRoute } from '@/lib/fixed-assets/routes';
import { getCategoryOptions, getStatusBadgeVariant } from '@/lib/fixed-assets/helpers';

interface RegisterPageWithCRUDProps {
  category: FixedAssetCategory;
}

/**
 * Register page component with full CRUD functionality
 */
export function RegisterPageWithCRUD({ category }: RegisterPageWithCRUDProps) {
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
  const [formData, setFormData] = useState({
    parishId: '',
    inventoryNumber: '',
    name: '',
    description: '',
    category: category,
    type: '',
    location: '',
    acquisitionDate: '',
    acquisitionValue: '',
    currentValue: '',
    depreciationMethod: '',
    usefulLifeYears: '',
    status: 'active' as 'active' | 'inactive' | 'disposed' | 'damaged',
    disposalDate: '',
    disposalValue: '',
    disposalReason: '',
    notes: '',
  });

  // Get translation key for this category
  const categoryTranslationKey = CATEGORY_TRANSLATION_KEYS[category];
  const categoryLabel = tMenu(categoryTranslationKey) || categoryTranslationKey;

  useEffect(() => {
    fetchParishes({ all: true });
  }, [fetchParishes]);

  useEffect(() => {
    const params: any = {
      page: currentPage,
      pageSize: 10,
      search: searchTerm || undefined,
      parishId: parishFilter || undefined,
      category,
    };
    fetchFixedAssets(params);
  }, [currentPage, searchTerm, parishFilter, category, fetchFixedAssets]);

  const resetForm = () => {
    setFormData({
      parishId: '',
      inventoryNumber: '',
      name: '',
      description: '',
      category: category,
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
    setSelectedAsset(null);
  };

  const handleAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEdit = (asset: FixedAsset) => {
    setSelectedAsset(asset);
    setFormData({
      parishId: asset.parishId,
      inventoryNumber: asset.inventoryNumber,
      name: asset.name,
      description: asset.description || '',
      category: asset.category || category,
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
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (selectedAsset) {
      const result = await updateFixedAsset(selectedAsset.id, formData);
      if (result) {
        setShowEditModal(false);
        setSelectedAsset(null);
        resetForm();
        fetchFixedAssets({ page: currentPage, pageSize: 10, category });
      }
    } else {
      const result = await createFixedAsset(formData);
      if (result) {
        setShowAddModal(false);
        resetForm();
        fetchFixedAssets({ page: currentPage, pageSize: 10, category });
      }
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      const success = await deleteFixedAsset(deleteConfirm);
      if (success) {
        setDeleteConfirm(null);
        fetchFixedAssets({ page: currentPage, pageSize: 10, category });
      }
    }
  };

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

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleParishFilterChange = (value: string) => {
    setParishFilter(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setParishFilter('');
    setCurrentPage(1);
  };

  const breadcrumbItems = [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: t('accounting') || 'Accounting', href: `/${locale}/dashboard/accounting` },
    { label: tMenu('fixedAssets') || 'Mijloace fixe', href: `/${locale}/dashboard/accounting/fixed-assets` },
    { label: categoryLabel, href: getCategoryRoute(category, locale) },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbItems} />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{categoryLabel}</h1>
            <Button onClick={handleAdd}>{t('add') || 'Add'}</Button>
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
      >
        <div className="space-y-4">
          <Select
            label={t('selectParish') || 'Select Parish'}
            value={formData.parishId}
            onChange={(e) => setFormData({ ...formData, parishId: e.target.value })}
            options={parishes.map(p => ({ value: p.id, label: p.name }))}
          />
          <Input
            label={t('inventoryNumber') || 'Inventory Number'}
            value={formData.inventoryNumber}
            onChange={(e) => setFormData({ ...formData, inventoryNumber: e.target.value })}
            required
          />
          <Input
            label={t('name') || 'Name'}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label={t('description') || 'Description'}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            multiline
          />
          <Input
            label={t('type') || 'Type'}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          />
          <Input
            label={t('location') || 'Location'}
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
          <Input
            label={t('acquisitionDate') || 'Acquisition Date'}
            type="date"
            value={formData.acquisitionDate}
            onChange={(e) => setFormData({ ...formData, acquisitionDate: e.target.value })}
          />
          <Input
            label={t('acquisitionValue') || 'Acquisition Value'}
            type="number"
            step="0.01"
            value={formData.acquisitionValue}
            onChange={(e) => setFormData({ ...formData, acquisitionValue: e.target.value })}
          />
          <Input
            label={t('currentValue') || 'Current Value'}
            type="number"
            step="0.01"
            value={formData.currentValue}
            onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
          />
          <Select
            label={t('status') || 'Status'}
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            options={[
              { value: FIXED_ASSET_STATUS.ACTIVE, label: t('active') || 'Active' },
              { value: FIXED_ASSET_STATUS.INACTIVE, label: t('inactive') || 'Inactive' },
              { value: FIXED_ASSET_STATUS.DISPOSED, label: t('disposed') || 'Disposed' },
              { value: FIXED_ASSET_STATUS.DAMAGED, label: t('damaged') || 'Damaged' },
            ]}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { setShowAddModal(false); resetForm(); }}>
              {t('cancel') || 'Cancel'}
            </Button>
            <Button onClick={handleSave}>{t('save') || 'Save'}</Button>
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
      >
        <div className="space-y-4">
          <Select
            label={t('selectParish') || 'Select Parish'}
            value={formData.parishId}
            onChange={(e) => setFormData({ ...formData, parishId: e.target.value })}
            options={parishes.map(p => ({ value: p.id, label: p.name }))}
          />
          <Input
            label={t('inventoryNumber') || 'Inventory Number'}
            value={formData.inventoryNumber}
            onChange={(e) => setFormData({ ...formData, inventoryNumber: e.target.value })}
            required
          />
          <Input
            label={t('name') || 'Name'}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label={t('description') || 'Description'}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            multiline
          />
          <Input
            label={t('type') || 'Type'}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          />
          <Input
            label={t('location') || 'Location'}
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
          <Input
            label={t('acquisitionDate') || 'Acquisition Date'}
            type="date"
            value={formData.acquisitionDate}
            onChange={(e) => setFormData({ ...formData, acquisitionDate: e.target.value })}
          />
          <Input
            label={t('acquisitionValue') || 'Acquisition Value'}
            type="number"
            step="0.01"
            value={formData.acquisitionValue}
            onChange={(e) => setFormData({ ...formData, acquisitionValue: e.target.value })}
          />
          <Input
            label={t('currentValue') || 'Current Value'}
            type="number"
            step="0.01"
            value={formData.currentValue}
            onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
          />
          <Select
            label={t('status') || 'Status'}
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            options={[
              { value: FIXED_ASSET_STATUS.ACTIVE, label: t('active') || 'Active' },
              { value: FIXED_ASSET_STATUS.INACTIVE, label: t('inactive') || 'Inactive' },
              { value: FIXED_ASSET_STATUS.DISPOSED, label: t('disposed') || 'Disposed' },
              { value: FIXED_ASSET_STATUS.DAMAGED, label: t('damaged') || 'Damaged' },
            ]}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { setShowEditModal(false); resetForm(); }}>
              {t('cancel') || 'Cancel'}
            </Button>
            <Button onClick={handleSave}>{t('save') || 'Save'}</Button>
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
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              {t('cancel') || 'Cancel'}
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              {t('delete') || 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

