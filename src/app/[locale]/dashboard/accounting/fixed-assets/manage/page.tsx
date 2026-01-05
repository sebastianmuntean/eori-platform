'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { FormModal } from '@/components/accounting/FormModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useFixedAssets, FixedAsset } from '@/hooks/useFixedAssets';
import { useParishes } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterGrid, FilterClear, ParishFilter, FilterSelect } from '@/components/ui/FilterGrid';
import { FIXED_ASSET_STATUS } from '@/lib/fixed-assets/constants';
import { getCategoryOptions, getStatusBadgeVariant } from '@/lib/fixed-assets/helpers';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ACCOUNTING_PERMISSIONS } from '@/lib/permissions/accounting';

export default function FixedAssetsManagePage() {
  const { loading: permissionLoading } = useRequirePermission(ACCOUNTING_PERMISSIONS.FIXED_ASSETS_MANAGE);
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');

  if (permissionLoading) {
    return <div>{t('loading')}</div>;
  }

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
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
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
    category: '',
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

  useEffect(() => {
    fetchParishes({ all: true });
  }, [fetchParishes]);

  useEffect(() => {
    const params: any = {
      page: currentPage,
      pageSize: 10,
      search: searchTerm || undefined,
      parishId: parishFilter || undefined,
      category: categoryFilter || undefined,
      type: typeFilter || undefined,
      status: statusFilter || undefined,
    };
    fetchFixedAssets(params);
  }, [currentPage, searchTerm, parishFilter, categoryFilter, typeFilter, statusFilter, fetchFixedAssets]);

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
      category: asset.category || '',
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
        fetchFixedAssets({ page: currentPage, pageSize: 10 });
      }
    } else {
      const result = await createFixedAsset(formData);
      if (result) {
        setShowAddModal(false);
        resetForm();
        fetchFixedAssets({ page: currentPage, pageSize: 10 });
      }
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteFixedAsset(id);
    if (success) {
      setDeleteConfirm(null);
      fetchFixedAssets({ page: currentPage, pageSize: 10 });
    }
  };

  const resetForm = () => {
    setFormData({
      parishId: '',
      inventoryNumber: '',
      name: '',
      description: '',
      category: '',
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

  const columns: any[] = [
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
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: t('accounting') || 'Accounting', href: `/${locale}/dashboard/accounting` },
          { label: tMenu('fixedAssets') || 'Mijloace fixe', href: `/${locale}/dashboard/accounting/fixed-assets` },
          { label: tMenu('fixedAssetsManagement') || 'Gestionare', href: `/${locale}/dashboard/accounting/fixed-assets/manage` },
        ]}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{tMenu('fixedAssetsManagement') || 'Mijloace fixe si obiecte de inventar'}</h1>
            <Button onClick={handleAdd}>{t('add') || 'Add'}</Button>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="flex gap-4">
              <SearchInput
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={t('search') || 'Search...'}
              />
            </div>

            <FilterGrid>
              <ParishFilter
                value={parishFilter}
                onChange={(value) => {
                  setParishFilter(value);
                  setCurrentPage(1);
                }}
                parishes={parishes}
              />
              <FilterSelect
                label={t('category') || 'Category'}
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={getCategoryOptions(tMenu)}
              />
              <FilterSelect
                label={t('status') || 'Status'}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: '', label: t('all') || 'All' },
                  { value: FIXED_ASSET_STATUS.ACTIVE, label: t('active') || 'Active' },
                  { value: FIXED_ASSET_STATUS.INACTIVE, label: t('inactive') || 'Inactive' },
                  { value: FIXED_ASSET_STATUS.DISPOSED, label: t('disposed') || 'Disposed' },
                  { value: FIXED_ASSET_STATUS.DAMAGED, label: t('damaged') || 'Damaged' },
                ]}
              />
              <FilterClear
                onClear={() => {
                  setSearchTerm('');
                  setParishFilter('');
                  setCategoryFilter('');
                  setTypeFilter('');
                  setStatusFilter('');
                  setCurrentPage(1);
                }}
              />
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

            {/* Pagination */}
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

      {/* Add/Edit Modal */}
      <FormModal
        isOpen={showAddModal || showEditModal}
        onClose={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          resetForm();
        }}
        onCancel={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          resetForm();
        }}
        title={selectedAsset ? (t('editFixedAsset') || 'Edit Fixed Asset') : (t('addFixedAsset') || 'Add Fixed Asset')}
        onSubmit={handleSave}
        isSubmitting={false}
        submitLabel={t('save') || 'Save'}
        cancelLabel={t('cancel') || 'Cancel'}
        size="lg"
      >
        <div className="space-y-4 max-h-[80vh] overflow-y-auto">
          <Select
            label={t('parish') || 'Parish'}
            value={formData.parishId}
            onChange={(e) => setFormData({ ...formData, parishId: e.target.value })}
            options={parishes.map(p => ({ value: p.id, label: p.name }))}
            required
          />
          <Input
            label={t('inventoryNumber') || 'Număr Inventar'}
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
            type="textarea"
          />
          <Select
            label={t('category') || 'Category'}
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={[
              { value: '', label: t('select') || 'Select...' },
              { value: 'cladiri', label: tMenu('buildings') || 'Cladiri' },
              { value: 'terenuri', label: tMenu('land') || 'Terenuri' },
              { value: 'transport', label: tMenu('transport') || 'Transport' },
              { value: 'materiale_pretioase', label: tMenu('preciousObjects') || 'Materiale Prețioase' },
              { value: 'obiecte_cult', label: tMenu('religiousObjects') || 'Obiecte Cult' },
              { value: 'mobilier', label: tMenu('furniture') || 'Mobilier' },
              { value: 'carti_cult', label: tMenu('religiousBooks') || 'Cărți Cult' },
              { value: 'carti_biblioteca', label: tMenu('libraryBooks') || 'Cărți Biblioteca' },
              { value: 'bunuri_culturale', label: tMenu('culturalGoods') || 'Bunuri Culturale' },
              { value: 'modernizari', label: tMenu('modernizations') || 'Modernizari' },
            ]}
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
          <Input
            label={t('depreciationMethod') || 'Depreciation Method'}
            value={formData.depreciationMethod}
            onChange={(e) => setFormData({ ...formData, depreciationMethod: e.target.value })}
          />
          <Input
            label={t('usefulLifeYears') || 'Useful Life (Years)'}
            type="number"
            value={formData.usefulLifeYears}
            onChange={(e) => setFormData({ ...formData, usefulLifeYears: e.target.value })}
          />
          <Select
            label={t('status') || 'Status'}
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            options={[
              { value: 'active', label: t('active') || 'Active' },
              { value: 'inactive', label: t('inactive') || 'Inactive' },
              { value: 'disposed', label: t('disposed') || 'Disposed' },
              { value: 'damaged', label: t('damaged') || 'Damaged' },
            ]}
          />
          {formData.status === 'disposed' && (
            <>
              <Input
                label={t('disposalDate') || 'Disposal Date'}
                type="date"
                value={formData.disposalDate}
                onChange={(e) => setFormData({ ...formData, disposalDate: e.target.value })}
              />
              <Input
                label={t('disposalValue') || 'Disposal Value'}
                type="number"
                step="0.01"
                value={formData.disposalValue}
                onChange={(e) => setFormData({ ...formData, disposalValue: e.target.value })}
              />
              <Input
                label={t('disposalReason') || 'Disposal Reason'}
                value={formData.disposalReason}
                onChange={(e) => setFormData({ ...formData, disposalReason: e.target.value })}
                type="textarea"
              />
            </>
          )}
          <Input
            label={t('notes') || 'Notes'}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            type="textarea"
          />
        </div>
      </FormModal>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title={t('confirmDelete') || 'Confirm Delete'}
        message={t('confirmDeleteMessage') || 'Are you sure you want to delete this fixed asset?'}
        confirmLabel={t('delete') || 'Delete'}
        cancelLabel={t('cancel') || 'Cancel'}
        variant="danger"
      />
    </div>
  );
}

