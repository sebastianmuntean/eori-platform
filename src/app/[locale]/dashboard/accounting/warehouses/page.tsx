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
import { useWarehouses, Warehouse } from '@/hooks/useWarehouses';
import { useParishes } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterGrid, FilterClear, ParishFilter, FilterSelect } from '@/components/ui/FilterGrid';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ACCOUNTING_PERMISSIONS } from '@/lib/permissions/accounting';

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
  const [formData, setFormData] = useState({
    parishId: '',
    code: '',
    name: '',
    type: 'general' as 'general' | 'retail' | 'storage' | 'temporary',
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

  useEffect(() => {
    if (permissionLoading) return;
    const params: any = {
      page: currentPage,
      pageSize: 10,
      search: searchTerm || undefined,
      parishId: parishFilter || undefined,
      type: typeFilter || undefined,
      isActive: isActiveFilter === '' ? undefined : isActiveFilter === 'true',
    };
    fetchWarehouses(params);
  }, [permissionLoading, currentPage, searchTerm, parishFilter, typeFilter, isActiveFilter, fetchWarehouses]);

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

  const handleSave = async () => {
    if (selectedWarehouse) {
      const result = await updateWarehouse(selectedWarehouse.id, formData);
      if (result) {
        setShowEditModal(false);
        setSelectedWarehouse(null);
        fetchWarehouses({ page: currentPage, pageSize: 10 });
      }
    } else {
      const result = await createWarehouse(formData);
      if (result) {
        setShowAddModal(false);
        resetForm();
        fetchWarehouses({ page: currentPage, pageSize: 10 });
      }
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteWarehouse(id);
    if (success) {
      setDeleteConfirm(null);
      fetchWarehouses({ page: currentPage, pageSize: 10 });
    }
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
  };

  const columns: any[] = [
    { key: 'code', label: t('code') || 'Code', sortable: true },
    { key: 'name', label: t('name') || 'Name', sortable: true },
    {
      key: 'type',
      label: t('type') || 'Type',
      sortable: false,
      render: (value: string) => (
        <Badge variant="secondary" size="sm">
          {value}
        </Badge>
      ),
    },
    {
      key: 'invoiceSeries',
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
      key: 'isActive',
      label: t('status') || 'Status',
      sortable: false,
      render: (value: boolean) => (
        <Badge variant={value ? 'success' : 'secondary'} size="sm">
          {value ? t('active') || 'Active' : t('inactive') || 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
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
  ];

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return <div>{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: t('accounting') || 'Accounting', href: `/${locale}/dashboard/accounting` },
          { label: t('warehouses') || 'Warehouses', href: `/${locale}/dashboard/accounting/warehouses` },
        ]}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{t('warehouses') || 'Warehouses'}</h1>
            <Button onClick={handleAdd}>{t('add') || 'Add'}</Button>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="flex gap-4">
              <SearchInput
                value={searchTerm}
                onChange={(value: string) => {
                  setSearchTerm(value);
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
                label={t('type') || 'Type'}
                value={typeFilter}
                onChange={(value) => {
                  setTypeFilter(value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: '', label: t('all') || 'All' },
                  { value: 'general', label: 'General' },
                  { value: 'retail', label: 'Retail' },
                  { value: 'storage', label: 'Storage' },
                  { value: 'temporary', label: 'Temporary' },
                ]}
              />
              <FilterSelect
                label={t('status') || 'Status'}
                value={isActiveFilter}
                onChange={(value) => {
                  setIsActiveFilter(value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: '', label: t('all') || 'All' },
                  { value: 'true', label: t('active') || 'Active' },
                  { value: 'false', label: t('inactive') || 'Inactive' },
                ]}
              />
              <FilterClear
                onClear={() => {
                  setSearchTerm('');
                  setParishFilter('');
                  setTypeFilter('');
                  setIsActiveFilter('');
                  setCurrentPage(1);
                }}
              />
            </FilterGrid>

            {error && (
              <div className="p-4 bg-danger/10 text-danger rounded">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-8 text-text-secondary">{t('loading') || 'Loading...'}</div>
            ) : (
              <Table
                data={warehouses}
                columns={columns}
              />
            )}

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
        title={selectedWarehouse ? (t('editWarehouse') || 'Edit Warehouse') : (t('addWarehouse') || 'Add Warehouse')}
        onSubmit={handleSave}
        isSubmitting={false}
        submitLabel={t('save') || 'Save'}
        cancelLabel={t('cancel') || 'Cancel'}
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label={t('parish') || 'Parish'}
            value={formData.parishId}
            onChange={(e) => setFormData({ ...formData, parishId: e.target.value })}
            options={parishes.map(p => ({ value: p.id, label: p.name }))}
            required
          />
          <Input
            label={t('code') || 'Code'}
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
          />
          <Input
            label={t('name') || 'Name'}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Select
            label={t('type') || 'Type'}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            options={[
              { value: 'general', label: 'General' },
              { value: 'retail', label: 'Retail' },
              { value: 'storage', label: 'Storage' },
              { value: 'temporary', label: 'Temporary' },
            ]}
          />
          <Input
            label={t('address') || 'Address'}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          <Input
            label={t('responsibleName') || 'Responsible Name'}
            value={formData.responsibleName}
            onChange={(e) => setFormData({ ...formData, responsibleName: e.target.value })}
          />
          <Input
            label={t('phone') || 'Phone'}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input
            label={t('email') || 'Email'}
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label={t('invoiceSeries') || 'Serie Factură'}
            value={formData.invoiceSeries}
            onChange={(e) => setFormData({ ...formData, invoiceSeries: e.target.value })}
            placeholder="ex: INV, FACT, etc."
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="isActive" className="text-sm">{t('active') || 'Active'}</label>
          </div>
        </div>
      </FormModal>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title={t('confirmDelete') || 'Confirm Delete'}
        message={t('confirmDeleteMessage') || 'Are you sure you want to delete this warehouse?'}
        confirmLabel={t('delete') || 'Delete'}
        cancelLabel={t('cancel') || 'Cancel'}
        variant="danger"
      />
    </div>
  );
}

